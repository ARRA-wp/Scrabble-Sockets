import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import { GLOBAL } from './GLOBAL';

let socket;
let chat;
let leaderboard;
let gameboard;
let rack;
let mainpanel;
let topbar;
let currLetter = '';
let dropped = false;
let errorCache = '';
let connected = false;
let setErrorFunc;

/**
 * Collection of functions used to interface with the server.
 * All other classes should use this class for any server
 * communications rather than sending directly.
 */
export const Connection = ({ name, room }) => {
  const [error, setErr] = useState(errorCache);
  setErrorFunc = setErr;

  if (error !== '') {
    setErrorFunc = undefined;
    errorCache = '';
    return (
      <Redirect
        to={{
          pathname: '/',
          state: {
            name,
            room,
            error,
          },
        }}
      />
    );
  }

  return <span style={{ display: 'none' }} />;
};

Connection.propTypes = {
  name: PropTypes.string,
  room: PropTypes.string,
};

export function beginConnection(room, name, server, options, creating) {
  connected = false;
  let query = `room=${room}&name=${name}&creating=${creating}`;
  Object.keys(options).forEach(option => {
    query += `&${option}=${options[option]}`;
  });
  let serverTo = server;
  if (serverTo === '') serverTo = GLOBAL.MAIN_SERVER;
  else if (serverTo === 'DEBUG' || serverTo === 'localhost')
    serverTo = GLOBAL.LOCALHOST;
  socket = io.connect(serverTo, {
    query,
    reconnectionAttempts: 1,
    transports: ['websocket', 'polling', 'flashsocket'],
  });
  setTimeout(() => {
    if (!connected) {
      setError('No se pudo conectar al servidor');
    }
  }, GLOBAL.TIMEOUT);
  socket.on('connect', () => {
    connected = true;
    document.getElementById('loading').style.display = 'none';
  });
  socket.on('serverSendPlayerChat', data => {
    if (chat) {
      chat.addChatLine(data.sender, data.message, false);
    }
  });
  socket.on('serverSendLoginMessage', data => {
    if (chat) {
      chat.addLoginMessage(data.player, false);
    }
  });
  socket.on('serverSendAnnouncement', data => {
    chat.appendMessage(data.msg, data.color);
  });
  socket.on('serverSendUpdate', data => {
    if (leaderboard) {
      leaderboard.setState({ players: data.players });
    }
    if (gameboard) {
      gameboard.updateBoard(data.board);
      gameboard.setState({
        canPlace:
          data.status === 'playing' &&
          !data.players.filter(player => player.name === name)[0].loseTurn,
        options: data.options,
        size: GLOBAL.SIZE[data.options.boardSize],
      });
    }
    if (rack) {
      rack.setState({
        letters: data.players.filter(player => player.name === name)[0].letters,
        isPlaying: data.status === 'playing',
      });
    }
    if (topbar) {
      topbar.setState({
        time: data.time,
        status: data.status,
        playTime: data.options.playTime,
        challengeTime: data.options.challengeTime,
        simultaneous: data.options.simultaneous,
        currPlaying:
          data.options.simultaneous ||
          data.status !== 'playing' ||
          data.options.order === undefined
            ? ''
            : data.options.order[data.currPlaying],
      });
    }
    if (
      data.players.filter(player => player.name === name)[0].kick.length >=
        data.players.length - 1 &&
      data.players.length > 1
    ) {
      quitGame();
      setError('Te sacaron :O');
    }
  });
  socket.on('serverSendJoinError', data => {
    if (mainpanel) {
      mainpanel.setState({ error: data.error });
    }
    setError(data.error);
  });
  socket.on('serverSendChallengingTime', () => {
    if (gameboard) {
      gameboard.tempRemoveAll();
    }
  });
  socket.on('serverSendGameOver', data => {
    swal(
      'Game Over!',
      `${data.last} uso todas sus letras, asi que ${
        data.winners
      } gano el juego con ${data.score} puntos!`,
      'success',
    );
  });
}

/**
 * Shortcut to emit an event to the server.
 * @param {string} event Name of the event to trigger
 * @param {object} data The data to send
 */
export function emit(event, data) {
  if (socket !== undefined) socket.emit(event, data);
  // else error = 'Could not connect to server';
}

// The following register functions should be called from their respective
// objects to allow Connection to access their properties.
export function registerChat(c) {
  chat = c;
}
export function registerLeaderboard(board) {
  leaderboard = board;
}
export function registerGameboard(board) {
  gameboard = board;
}
export function registerRack(thisRack) {
  rack = thisRack;
}
export function registerMainPanel(thisMainPanel) {
  mainpanel = thisMainPanel;
}
export function registerTopbar(thisTopbar) {
  topbar = thisTopbar;
}
// // // // //

export function getGameboard() {
  return gameboard;
}
export function submit() {
  socket.emit('submit', {
    board: gameboard.state.board,
  });
}
export function quitGame() {
  chat.appendMessage(`${chat.state.player} dejo el juego`, 'purple');
  document.getElementById('loading').style.display = 'fixed';
  connected = false;
  errorCache = '';
  setErrorFunc('');
  setErrorFunc = undefined;
  socket.disconnect();
}
export function getCurrLetter() {
  return currLetter;
}
export function setCurrLetter(newLetter) {
  currLetter = newLetter;
}
export function setDropped(drop) {
  dropped = drop;
}
export function getDropped() {
  return dropped;
}
export function setError(err) {
  if (setErrorFunc !== undefined) {
    setErrorFunc(err);
  } else {
    errorCache = err;
  }
}
