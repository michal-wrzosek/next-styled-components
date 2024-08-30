'use client';

import { styled } from '@/react-component-lib';
import { useState } from 'react';

const StyledDiv = styled.div<{ $isOn: boolean }>`
  width: 150px;
  height: 150px;
  padding: 10px;
  background-color: ${({ $isOn }) => ($isOn ? 'pink' : 'green')};
`;

export const Client = () => {
  const [isOn, setIsOnClick] = useState(false);

  return (
    <StyledDiv $isOn={isOn} onClick={() => setIsOnClick((prev) => !prev)}>
      Client Component
    </StyledDiv>
  );
};
