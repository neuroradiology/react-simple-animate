// @flow
import React, { type Element } from 'react';
import type { AnimationType, AnimationStateType } from './animate';
import calculateTotalDuration from './utils/calculateTotalDuration';

type Sequence = AnimationType & {
  sequenceId?: string | number,
  sequenceIndex?: number,
};

type Sequences = Array<Sequence>;

type Props = {
  play: boolean,
  sequences: Sequences,
  children: Element<*>,
};

type State = {
  animationStates?: AnimationStateType,
};

export const AnimateContext = React.createContext({
  animationStates: {},
  register: undefined,
});

export default class AnimateGroup extends React.PureComponent<Props, State> {
  static displayName = 'ReactSimpleAnimateGroup';

  static defaultProps = {
    sequences: [],
  };

  state = {
    animationStates: {},
  };

  componentDidMount() {
    this.props.play && this.calculateSequences();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.play !== prevProps.play) this.calculateSequences();
  }

  componentWillUnmount() {
    Object.values(this.timers).forEach((timer: any) => clearTimeout(timer));
  }

  setupAnimationTimers = ({
    totalDuration,
    id,
    restAttributes,
    play,
  }: {
    totalDuration: number,
    id: string,
    restAttributes: AnimationType,
    play: boolean,
  }) => {
    this.timers[id] = setTimeout(() => {
      this.setState(previousState => {
        const stateCopy = { ...previousState.animationStates };

        if (!stateCopy[id]) stateCopy[id] = {};
        Object.entries(restAttributes).forEach(([key, value]) => {
          stateCopy[id][key] = value;
        });
        stateCopy[id].play = play;

        return {
          animationStates: stateCopy,
        };
      });
    }, totalDuration);
  };

  calculateSequences = () => {
    const { sequences, play } = this.props;
    const sequencesToAnimate: any = sequences.length ? sequences : Object.values(this.animations);

    return (play ? sequencesToAnimate : [...sequencesToAnimate].reverse()).reduce(
      (previous, current, currentIndex) => {
        const { sequenceId, ...restAttributes } = current;
        const id = sequenceId || currentIndex;
        const totalDuration =
          previous +
          calculateTotalDuration({
            ...this.animations[id],
            restAttributes,
          });

        this.setupAnimationTimers({
          id,
          totalDuration,
          restAttributes,
          play,
        });
        return totalDuration;
      },
      0,
    );
  };

  register = (props: Sequence) => {
    const { sequenceIndex, sequenceId } = props;
    const id = sequenceId || sequenceIndex;
    if (id === undefined || (sequenceIndex && sequenceIndex < 0) || (sequenceId && sequenceId === '')) return;

    this.animations[id] = {
      ...props,
    };
  };

  timers: { [string | number]: TimeoutID } = {};
  animations: { [string | number]: AnimationType } = {};

  render() {
    return (
      <AnimateContext.Provider value={{ animationStates: this.state.animationStates, register: this.register }}>
        {this.props.children}
      </AnimateContext.Provider>
    );
  }
}