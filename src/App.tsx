import "./App.css";
import { roles, events } from "./events";
import { filter, intersection } from "lodash";
import { generateRandomColor } from "./utils";
import { useLocation } from "react-router-dom";
import { ChakraProvider, Container, Heading, VStack } from "@chakra-ui/react";
import { Calendar } from "./components/Calendar";
import React from "react";

// for checking valid date format
const dateFormat =
  /^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d/;

// map of activity : color
const activityColors: { [activity in string]: string } = events.reduce(
  (acc, event) => {
    const activity = event.tags?.activity;
    if (activity && Object.keys(acc).indexOf(activity) === -1) {
      return { ...acc, [activity]: generateRandomColor() };
    } else {
      return acc;
    }
  },
  {}
);

// map of department : color
const deptColors: { [dept in string]: string } = events.reduce((acc, event) => {
  const dept = event.tags?.dept;
  if (dept && Object.keys(acc).indexOf(dept) === -1) {
    return { ...acc, [dept]: generateRandomColor() };
  } else {
    return acc;
  }
}, {});

// convert events to FullCalendar format
// NOTE: full day event should not have time
// See https://fullcalendar.io/docs/event-object for Event object
const calEvents = events
  .filter(
    (e) =>
      !!e.start &&
      !!e.end &&
      e.start.match(dateFormat) !== null &&
      e.end.match(dateFormat) !== null
  )
  .map((e) => ({
    ...e,
    title: `${e.tags?.activity?.toUpperCase() ?? ""}: ${e.title}`,
    start: e.start.includes(",")
      ? new Date(e.start)
      : new Date(e.start).toISOString().replace(/T.*$/, ""),
    end: e.end.includes(",")
      ? new Date(e.end)
      : new Date(e.end).toISOString().replace(/T.*$/, ""),
    backgroundColor: `${
      e.tags?.activity ? activityColors[e.tags.activity] : "blue"
    }`, // based on activity
    textColor: e.tags?.dept ? deptColors[e.tags.dept] : "black", // based on departments
  }));

const App = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const activity = params.get("activity");
  const dept = params.get("dept");
  const name = params.get("name");

  let displayEvents = name
    ? filter(calEvents, (e) => intersection(e.owners, roles[name]).length > 0)
    : calEvents;

  displayEvents = activity
    ? displayEvents.filter((e) => e.tags?.activity === activity)
    : displayEvents;

  displayEvents = dept
    ? displayEvents.filter((e) => e.tags?.dept === dept)
    : displayEvents;

  // console.log(displayEvents);

  return (
    <ChakraProvider>
      <VStack>
        <Container maxW="container.lg" m={5}>
          <VStack m={2}>
            <Heading as="h1">CBCWLA Calendar</Heading>
          </VStack>
          <Calendar events={displayEvents} />
        </Container>
      </VStack>
    </ChakraProvider>
  );
};

export default App;
