import React from 'react';
import AppNavbar from '../components/AppNavbar';
import EHSTodos from '../components/EHSTodos';

const EHSTodosPage: React.FC = () => {
  return (
    <>
      <AppNavbar title="EHS Todos" />
      <EHSTodos />
    </>
  );
};

export default EHSTodosPage;
