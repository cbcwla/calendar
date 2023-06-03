import logo from './logo.svg';
import './App.css';
import events from './events.js';

function App() {
  return (
    <div className="App">
      <ul>{
        events.map( (event, index) =>
          <li key={ event.title } style={{padding: '2px', margin: '2px', backgroundColor:  index % 2 ? 'white' : 'lightGray' }}>
            <p>{ event.title }</p>
            <p>{ Object.values(event.tags).map( (tag) => `#${tag}`).join(', ') }</p>
            <p>{ event.start === event.end ? event.start : `from ${event.start} to ${event.end}` } </p>
            <p>{ event.groups.join(', ') }</p>
            <p>details in html of { event.details.length } chars</p>
          </li>
        )
      }</ul>
    </div>
  );
}

export default App;
