/* eslint-disable react/prop-types */
/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 *
 */

import React from 'react';
import swal from 'sweetalert';
import GitHubButton from 'react-github-btn';
import { setError } from '../../components/Connection';
// import { FormattedMessage } from 'react-intl';
// import messages from './messages';
import MainPanel from '../../components/MainPanel';
import '../../css/menu.css';

export default function HomePage(props) {
  const ghBanner = (
    <div className="github-banner">
      <a
        href="https://github.com/64bitpandas/Simultaneous"
        target="_blank"
      >
        {' '}
      </a>
      
    </div>
  );
  if (props.location.state === undefined) {
    return (
      <div id="container">
        <MainPanel name="" room="" />
        {ghBanner}
      </div>
    );
  }
  if (props.location.state.error) {
    swal('Error al entrar al servidor', props.location.state.error, 'error').then(
      () => {
        setError('');
      },
    );
  }
  return (
    <div id="container">
      <MainPanel
        name={props.location.state.name}
        room={props.location.state.room}
      />
      {ghBanner}
    </div>
  );
}
