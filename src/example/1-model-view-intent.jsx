import { run } from '@cycle/run';
import { makeDOMDriver } from '@cycle/dom';
import xs from 'xstream';

/*
Model-View-Intent (MVI)
Notes & example from https://cycle.js.org/model-view-intent.html

Intent: Observes and interprets user actions
Model: Observes the intent, managing state
View: Observes the model and represents its state

DOM source -> action streams -> state stream -> stream of virtual DOM nodes
Misc sources  INTENT            MODEL           VIEW
              actions           state           virtual DOM

main() defines how DOM events create actions
which flow to the model, transforming state
represented in the view, which updates the DOM
The cycle is composed as three functions: intent, model, and view
*/

function main(sources) {
  const actions = intent(sources.DOM);
  const state$ = model(actions);
  const vdom$ = view(state$);
  return { DOM: view(model(intent(sources.DOM))) };
}

function intent(domSource) {
  const actions = {
    changeWeight$: observeUserAction(domSource, 'Weight'),
    changeHeight$: observeUserAction(domSource, 'Height')
  };
  return actions;
}

const observeUserAction = (domSource, className) => {
  const action = domSource
    .select(`.${className}`)
    .events('input')
    .map(event => event.target.value);
  return action;
};

function model(actions) {
  const weight$ = actions.changeWeight$.startWith(100);
  const height$ = actions.changeHeight$.startWith(150);
  const state$ = xs.combine(weight$, height$).map(([weight, height]) => ({
    weight,
    height,
    bmi: calcBMI(weight, height)
  }));
  return state$;
}

const calcBMI = (weight, height) => {
  const heightIn = height / 2.54;
  return Math.round(weight / heightIn / heightIn * 703 * 100) / 100;
};

function view(state$) {
  return state$.map(({ weight, height, bmi }) => (
    <div>
      {renderSlider('Weight', 'lbs.', weight, 80, 300)}
      {renderSlider('Height', 'ft.', height, 150, 250)}
      <h2>BMI: {bmi}</h2>
    </div>
  ));
}

const renderSlider = (label, unit, value, min, max) => {
  return (
    <div>
      <input type="range" className={label} min={min} max={max} value={value} />
      {` ${label}: `}
      {label === 'Height' ? Math.round(value / 30 * 100) / 100 : value}
      {` ${unit} `}
    </div>
  );
};

export default () => {
  run(main, {
    DOM: makeDOMDriver('#root')
  });
};
