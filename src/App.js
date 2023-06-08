import { Calendar } from "./components/Calendar.jsx";
import events from "./events.js";
import { ChakraProvider, Container, Heading, VStack } from "@chakra-ui/react";

// for checking valid date format
const dateFormat =
  /^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\d\d/;

// convert events to FullCalendar format
// full day event should not have time
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
    start: e.start.includes(",")
      ? new Date(e.start)
      : new Date(e.start).toISOString().replace(/T.*$/, ""),
    end: e.end.includes(",")
      ? new Date(e.end)
      : new Date(e.end).toISOString().replace(/T.*$/, ""),
  }));

function App() {
  return (
    <ChakraProvider>
      <VStack>
        <Container maxW="container.lg" m={5}>
          <VStack m={2}>
            <Heading as="h1">CBCWLA Calendar</Heading>
          </VStack>
          <Calendar events={calEvents} />
        </Container>
      </VStack>
    </ChakraProvider>
  );
}

export default App;
