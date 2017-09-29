import React from 'react';
import Hand from './Hand';
import PlayerList from './PlayerList';
import Table from './Table';
import Actions from './Actions';
import socket from '../../socket/index.js';


class GameRoom extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: '',
      room: '',
      hand: [],
      blackCard: {},
      roomCreator: '',
      submittedCards: [],
      turnPhase: '',
      playerArray: [],
      czar: '',
      yourSumittedCards: [],

    };

    this.startGame = this.startGame.bind(this); 
    this.initializeGame = this.initializeGame.bind(this);
    this.cardSubmission = this.cardSubmission.bind(this);
    this.revealCard = this.revealCard.bind(this);
    this.winnerSelected = this.winnerSelected.bind(this);
    this.endTurn = this.endTurn.bind(this);
  
  }

  componentDidMount() {
    this.setState({
      user: this.props.username,
      room: this.props.match.params.room,
    });
    socket.on('gameHasStarted', () => {
      this.initializeGame();
    });
    socket.on('refillHand', (cards) => {
      this.setState({
        hand: cards
      });
    });
    socket.on('setupNewTurn', (blackCard, czar) => {
      this.setState({
        blackCard: blackCard,
        czar: czar
      });
    });
    socket.on('updatePhase', (phase) => {
      console.log('We are switching to phase: ', phase);
      this.setState({
        turnPhase: phase,
      });
      if (phase === 'revelation') {
        this.state.yourSumittedCards = [];
      }
    });
    socket.on('updateSubmittedCards', (submitted) => {
      this.setState({
        submittedCards: submitted,
      });
      console.log(submitted);

    });
    socket.on('updatePlayers', (players) => {
      this.setState({
        playerArray: players
      });
      if (players.length === 1) {
        this.setState({
          roomCreator: players[0].username
        });
      }
    });
    
    // note: need to find better way of grabbing room name
    socket.emit('enterRoom', this.props.match.params.room);

  }

  componentWillUnmount() {
    socket.removeAllListeners();
  }

  startGame() {
    console.log(this.state.roomCreator);

    socket.emit('startGame', this.state.room);

  }

  initializeGame() {
    socket.emit('initializeGame', this.state.room, this.props.username);
  }

  cardSubmission(card) {
    if (this.state.turnPhase === 'submission' && this.state.user !== this.state.czar) {
      this.state.yourSumittedCards.push(card);
      if (this.state.yourSumittedCards.length === this.state.blackCard.pick) {
        socket.emit('cardSubmission', this.state.room, this.props.username, this.state.yourSumittedCards);
      }
    }
  }
  revealCard(card) {
    if (this.state.turnPhase === 'revelation' && this.props.username === this.state.czar) {
      socket.emit('revealCard', this.state.room, card.username);
    }
  }

  winnerSelected(card) {
    if (this.props.username === this.state.czar && this.state.turnPhase === 'judgement') {
      socket.emit('winnerSelected', this.state.room, card.username);
    }
  }

  endTurn() {
    if (this.state.turnPhase === 'end') {
      socket.emit('endTurn', this.state.room);
    }
  }


  render() {
    return (
      <div>
        <div className='Logo'>Greenfield Against Humanity</div>
        <div className='RoomName'>{this.state.room}</div>
        <Actions startGame={this.startGame} endTurn={this.endTurn} state={this.state}/>
        <PlayerList players={this.state.playerArray} czar={this.state.czar}/>
        <Table 
          select={this.winnerSelected} 
          submit={this.cardSubmission} 
          black={this.state.blackCard} 
          cards={this.state.hand} 
          submittedCards={this.state.submittedCards}
          revealCard={this.revealCard}
        />

      </div>
    );
  }
}

export default GameRoom;