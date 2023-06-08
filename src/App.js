import "./App.css";
import { roles, events } from "./events.js";
import { filter, intersection, map } from "lodash";
import { ChakraProvider } from "@chakra-ui/react";

function App() {
  var name = null;

  const displayEvents = name
    ? filter(events, (e) => intersection(e.owners, roles[name]).length > 0)
    : events;

  return (
    <ChakraProvider>
      <div className="App">
        <ul>
          {map(displayEvents, (event, index) => (
            <li
              key={event.title}
              style={{
                padding: "2px",
                margin: "2px",
                backgroundColor: index % 2 ? "white" : "lightGray",
              }}
            >
              <p>{event.title}</p>
              <p>
                {Object.values(event.tags)
                  .map((tag) => `#${tag}`)
                  .join(", ")}
              </p>
              <p>
                {event.start === event.end
                  ? event.start
                  : `from ${event.start} to ${event.end}`}{" "}
              </p>
              <p>{event.groups && event.groups.join(", ")}</p>
              <p>
                {event.details &&
                  `details in html of ${event.details.length} chars`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </ChakraProvider>
  );
}

export default App;
