'use client';

// import { styled } from 'next-styled-components';
import { styled } from '@/react-component-lib';
import { useState } from 'react';

const StyledDiv = styled.div<{ $isOn: boolean }>`
  width: 150px;
  height: 150px;
  padding: 10px;
  background-color: ${({ $isOn }) => ($isOn ? 'pink' : 'green')};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const Client = () => {
  const [isOn, setIsOnClick] = useState(false);

  return (
    <StyledDiv $isOn={isOn} onClick={() => setIsOnClick((prev) => !prev)}>
      Client Component
    </StyledDiv>
  );
};
