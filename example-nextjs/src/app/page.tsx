// import { css, keyframes, styled } from 'next-styled-components';
import { css, keyframes, styled } from '@/react-component-lib';
import { Client } from './client';

const textCss = css`
  text-transform: capitalize;
  text-decoration: underline;
  font-style: italic;
`;

const fadeInOutAnimation = keyframes`
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
`;

const Secondary = styled.span.attrs<{ $isOn: boolean }>(() => ({ role: 'alert' }))`
  display: block;
  width: 100px;
  height: 100px;
  background-color: ${({ theme }) => theme.primaryColor};
  animation: ${fadeInOutAnimation} 1s infinite alternate;
`;

const Main = styled.div<{ color: string }>`
  width: 150px;
  height: 150px;
  padding: 10px;
  background-color: ${({ color }) => color};
  position: relative;

  ${textCss};

  &:hover {
    background-color: yellow;
  }

  & > ${Secondary} {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

export default function Home() {
  return (
    <>
      <Main color="red">
        Server Component
        <Secondary $isOn />
      </Main>
      <Client />
    </>
  );
}
