import React, { useState } from 'react';
import useProjectStore, { Folder, File, Project } from '../../../state/IDE/ProjectState';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Dialog, DialogActions, Menu, MenuItem, TextField } from '@mui/material';
import { CreateCustomButton, FileTreeWrapper, FileWrapper, FontColor } from '../IdeStyle';
import { deleteFile, deleteFolder, updateFolderName, updateFileName } from '../ProjectApi';
import { useTheTheme } from '../../Theme';

interface FileNode {
  name: string;
  id: string;
  parentId: string | null;
  type: string;
  onClick?: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLElement>, id: string, type: string) => void;
  children?: FileNode[];
}

interface Props {
  isCreatingFolder: boolean;
  setIsCreatingFolder: React.Dispatch<React.SetStateAction<boolean>>;
  isCreatingFile: boolean;
  setIsCreatingFile: React.Dispatch<React.SetStateAction<boolean>>;
  handleCreateFolder: (folderName: string, parentId: string | null) => void;
  handleCreateFile: (fileName: string, folderId: string) => void;
  newFolderName: string;
  setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
  newFileName: string;
  setNewFileName: React.Dispatch<React.SetStateAction<string>>;
  currentParentId: string | null;
  setCurrentParentId: React.Dispatch<React.SetStateAction<string | null>>;
}

const FileTree: React.FC<Props> = ({
  isCreatingFolder,
  setIsCreatingFolder,
  isCreatingFile,
  setIsCreatingFile,
  handleCreateFolder,
  handleCreateFile,
  newFolderName,
  setNewFolderName,
  newFileName,
  setNewFileName,
  currentParentId,
  setCurrentParentId,
}) => {
  const {
    projects,
    selectedProjectId,
    selectProject,
    selectedFileContent,
    removeFolder,
    removeFile,
    fetchFileContent,
  } = useProjectStore();
  const [contextMenuPosition, setContextMenuPosition] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNodeId, setEditNodeId] = useState('');
  const [editNodeType, setEditNodeType] = useState('');
  const selectedProject = projects.find(project => project.id === selectedProjectId);
  const { themeColor } = useTheTheme();

  //메뉴
  const handleContextMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    event.preventDefault();
    setContextMenuPosition({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });
    setCurrentParentId(id);
  };

  const handleCloseContextMenu = () => {
    setContextMenuPosition(null);
  };
  const refreshProject = async () => {
    if (selectedProjectId) {
      await selectProject(selectedProjectId);
    }
  };
  //생성하기
  const handleCreateNewFolder = async () => {
    await handleCreateFolder(newFolderName, currentParentId);
    setNewFolderName('');
    await refreshProject();
  };

  const handleCreateNewFile = async () => {
    if (currentParentId) {
      handleCreateFile(newFileName, currentParentId);
      setNewFileName('');
    }
    await refreshProject();
  };
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (isCreatingFolder) {
        handleCreateNewFolder();
      } else if (isCreatingFile) {
        handleCreateNewFile();
      }
    }
  };
  //삭제하기
  const handleDeleteFolder = async (folderId: string) => {
    if (!selectedProjectId) return;
    try {
      await deleteFolder(selectedProjectId, folderId);
      removeFolder(selectedProjectId, folderId);
      await refreshProject();
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const handleDeleteFile = async (folderId: string, fileId: string) => {
    if (!selectedProjectId) return;
    try {
      await deleteFile(selectedProjectId, folderId, fileId);
      removeFile(selectedProjectId, folderId, fileId);
      await refreshProject();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  //수정하기
  const handleEditName = () => {
    if (editNodeType === 'folder') {
      updateFolderName(selectedProjectId!, editNodeId, editName)
        .then(() => {
          refreshProject(); // 프로젝트 정보 새로고침
          handleCloseEditDialog();
        })
        .catch(error => {
          console.error('Failed to update folder name:', error);
        });
    } else if (editNodeType === 'file') {
      updateFileName(selectedProjectId!, currentParentId!, editNodeId, editName)
        .then(() => {
          refreshProject(); // 프로젝트 정보 새로고침
          handleCloseEditDialog();
        })
        .catch(error => {
          console.error('Failed to update file name:', error);
        });
    }
  };

  const handleOpenEditDialog = (id: string, type: string, currentName: string) => {
    setEditDialogOpen(true);
    setEditName(currentName);
    setEditNodeId(id);
    setEditNodeType(type);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  // 파일 내용 요청
  const handleFetchFile = (fileId: string) => {
    console.log('Trying to fetch file with ID:', fileId);
    const file = projects.flatMap(p => p.files).find(file => file.id === fileId);
    console.log('File search result:', file);

    const fileType = file?.type || 'file';
    if (file && fileType === 'file') {
      console.log('File found and is treated as a file');
      if (selectedProjectId) {
        fetchFileContent(selectedProjectId, file.parentId, fileId);
      } else {
        console.log('Selected Project ID is not set.');
      }
    } else {
      console.log('File not found or is not a file type');
    }
  };

  function renderNodes(nodes: FileNode[]): React.ReactNode {
    return nodes.map(node => (
      <Node
        key={node.id}
        name={node.name}
        id={node.id}
        parentId={node.parentId}
        type={node.type}
        onClick={() => (node.type === 'file' ? handleFetchFile(node.id) : null)}
        onContextMenu={event => handleContextMenu(event, node.id)}
        renderNodes={renderNodes}
        // eslint-disable-next-line react/no-children-prop
        children={node.children}
      />
    ));
  }

  return (
    <main>
      {selectedProject && renderNodes(convertProjectToNodes(selectedProject, handleContextMenu))}
      {isCreatingFolder && (
        <div>
          <TextField
            size="small"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="폴더명 입력"
            onKeyPress={handleKeyPress}
          />
        </div>
      )}
      {isCreatingFile && (
        <div>
          <TextField
            size="small"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            placeholder="파일명 입력"
            onKeyPress={handleKeyPress}
          />
        </div>
      )}

      <Menu
        open={contextMenuPosition !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenuPosition !== null
            ? { top: contextMenuPosition.mouseY, left: contextMenuPosition.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => setIsCreatingFolder(true)}>폴더 생성</MenuItem>
        <MenuItem onClick={() => setIsCreatingFile(true)}>파일 생성</MenuItem>
        <MenuItem onClick={() => handleDeleteFolder(currentParentId!)}>폴더 삭제</MenuItem>
        <MenuItem onClick={() => handleDeleteFile(currentParentId!, currentParentId!)}>파일 삭제</MenuItem>
        <MenuItem
          onClick={() =>
            handleOpenEditDialog(
              currentParentId!,
              'folder',
              selectedProject?.folders.find(f => f.id === currentParentId)?.name || '',
            )
          }
        >
          폴더 이름 수정
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleOpenEditDialog(
              currentParentId!,
              'file',
              selectedProject?.files.find(f => f.id === currentParentId)?.name || '',
            )
          }
        >
          파일 이름 수정
        </MenuItem>
      </Menu>

      {editDialogOpen && (
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="md"
          PaperProps={{
            style: {
              minWidth: '30%',
              minHeight: '30%',
              padding: '25px',
              backgroundColor: themeColor === 'light' ? 'white' : '#1C2631',
              border: '0.5px solid',
              borderColor: themeColor === 'light' ? 'black' : 'white',
            },
          }}
        >
          <FontColor className="text-xl font-semibold mb-3">수정하기</FontColor>
          <TextField
            autoFocus
            margin="dense"
            type="text"
            size="small"
            value={editName}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#28b381',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#28b381',
                },

                backgroundColor: themeColor === 'light' ? '#ffffff' : '#243B56',
                color: themeColor === 'light' ? 'black' : '#76ECC2',
              },
            }}
            onChange={e => setEditName(e.target.value)}
          />
          <DialogActions>
            <CreateCustomButton onClick={handleCloseEditDialog} className="bg-green-500 font-pretendard font-normal">
              취소하기
            </CreateCustomButton>
            <CreateCustomButton onClick={handleEditName} className="text-green-500 font-pretendard font-normal">
              수정하기
            </CreateCustomButton>
          </DialogActions>
        </Dialog>
      )}
    </main>
  );
};

//프로젝트를 노드로 만드는 함수
function convertProjectToNodes(
  project: Project,
  handleContextMenu: (event: React.MouseEvent<HTMLElement>, id: string, type: string) => void,
): FileNode[] {
  // 루트 레벨의 폴더와 파일을 모두 처리
  const rootFolders = project.folders.filter(folder => folder.parentId === null);
  const rootFiles = project.files.filter(file => file.parentId === null);

  const rootFolderNodes = rootFolders.map(folder => ({
    name: folder.name,
    id: folder.id,
    parentId: folder.parentId,
    type: 'folder',
    onContextMenu: (event: React.MouseEvent<HTMLElement>) => handleContextMenu(event, folder.id, 'folder'),
    children: convertFolderToNodes(project.folders, project.files, folder.id),
  }));

  const rootFileNodes = rootFiles.map(file => ({
    name: file.name,
    id: file.id,
    parentId: file.parentId,
    type: 'file',
    onContextMenu: (event: React.MouseEvent<HTMLElement>) => handleContextMenu(event, file.id, 'file'),
  }));

  // 폴더 노드와 파일 노드를 합친 배열을 반환
  return [...rootFolderNodes, ...rootFileNodes];
}

//폴더를 노드로 바꾸는 함수
function convertFolderToNodes(folders: Folder[], files: File[], parentId: string): FileNode[] {
  const childrenFolders = folders.filter(folder => folder.parentId === parentId);
  const childrenFiles = files.filter(file => file.parentId === parentId);

  const folderNodes = childrenFolders.map(folder => ({
    name: folder.name,
    id: folder.id,
    parentId: folder.parentId,
    type: 'folder',
    children: convertFolderToNodes(folders, files, folder.id),
  }));

  const fileNodes = childrenFiles.map(file => ({
    name: file.name,
    id: file.id,
    parentId: file.parentId,
    type: 'file',
  }));

  return [...folderNodes, ...fileNodes];
}

//노드 렌더링
function Node({
  name,
  id,
  type,
  onClick,
  onContextMenu,
  children,
  renderNodes,
}: FileNode & { renderNodes: (nodes: FileNode[]) => React.ReactNode }) {
  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    console.log(`Click detected on type: ${type} with ID: ${id}`);
    if (type === 'file') {
      if (onClick) {
        onClick(id);
      }
    }
  };
  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (onContextMenu) onContextMenu(event, id, type);
  };
  return (
    <FileTreeWrapper>
      <FileWrapper>
        <article
          className={type === 'file' ? 'file' : 'folder'}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          {type === 'file' ? (
            <InsertDriveFileOutlinedIcon fontSize="medium" />
          ) : (
            <FolderOpenOutlinedIcon fontSize="medium" />
          )}
          {name}
          {children && <div>{renderNodes(children)}</div>}
        </article>
      </FileWrapper>
    </FileTreeWrapper>
  );
}

export default FileTree;
