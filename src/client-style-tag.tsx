'use client';

import React, { useEffect, useState } from 'react';
import { CollectedStyles } from './collected-styles';

// Necessary to avoid class name collisions between server and client components
CollectedStyles.isOnClient = true;

export const ClientStyleTag = () => {
  const [styles, setStyles] = useState(CollectedStyles.getStyles());

  useEffect(() => {
    CollectedStyles.subscribe(() => {
      setStyles(CollectedStyles.getStyles());
    });
  });

  return <style data-id="styled-components-client" dangerouslySetInnerHTML={{ __html: styles }} />;
};
