import logo from './logo.svg';
import './App.css';
import events from './events.js';

function App() {
  return (
    <div className="App">
      <ul>{
        events.map( (event) =>
          <li>
            <span>{ event.title }</span> | 
            <span>{ event.start }</span> | 
            <span>{ event.groups }</span>
          </li>
        )
      }</ul>
    </div>
  );
}

export default App;
