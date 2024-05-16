import styled from 'styled-components';
import { ReactComponent as EditIcon } from '../../assets/Edit.svg';

export const MainPageWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  padding: 0 200px 0px 200px;
  flex-direction: column;
`;
export const AttendanceDiv = styled.div`
  border-radius: 15px;
  background-color: ${({ theme }) => (theme.themeColor === 'light' ? '#e1f9f0' : '#23BE87')};
  height: 32%;
  width: 100%;
  padding: 30px 50px;
  padding: 30px 50px;
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  /* align-items: center; */
`;

export const UserInfo = styled.div`
  margin-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.borderColor};
  height: 45%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;
export const EditUser = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  align-items: center;
  span {
    font-size: 16px;
    margin-bottom: 5px;
  }
`;
export const UserInput = styled.input`
  width: 95%;
  /* outline: none; */
  height: 100%;
  outline-color: #28b381;
  border-radius: 5px;
  border: 1px solid #d9d9d9;
  padding: 10px 20px;
  font-size: 16px;
  color: black;
`;
export const Edit = styled(EditIcon)`
  color: ${({ theme }) => (theme.themeColor === 'light' ? 'black' : 'white')};
  margin-left: 5px;
  &:hover {
    cursor: pointer;
    fill: white;
  }
  ${({ hidden }) =>
    hidden &&
    `
    opacity: 0;
    pointer-events: none;
  `}
`;
export const Save = styled.button`
  height: 17%;
  width: 13%;
  background-color: #28b381;
  color: white;
  border-radius: 20px;
  margin-top: 5px;
  &:hover {
    cursor: pointer;
    opacity: 0.8;
  }
`;
