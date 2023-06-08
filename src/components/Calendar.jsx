import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Box, Text, usePopper } from "@chakra-ui/react";
import { forwardRef, useState } from "react";

export const Calendar = ({ events }) => {
  const [focusedEvent, setFocusedEvent] = useState();

  const { popperRef, referenceRef } = usePopper({
    placement: "bottom",
  });

  const handleEventMouseEnter = ({ event, el }) => {
    referenceRef(el);
    setFocusedEvent(event);
  };

  const handleEventMouseLeave = () => {
    referenceRef(null);
    setFocusedEvent(null);
  };

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        // eventClick={handleEventClick}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
      />
      {focusedEvent && <DetailPopup event={focusedEvent} ref={popperRef} />}
    </>
  );
};

const DetailPopup = forwardRef((event, ref) => {
  return (
    <Box
      as="div"
      ref={ref}
      bg="white"
      borderColor="gray.200"
      borderWidth={1}
      borderRadius={5}
      w={400}
      zIndex={10}
      m={5}
    >
      <Text color="gray.900" fontWeight="bold" backgroundColor="gray.100" p={2}>
        {event.event.title}
      </Text>
      <Box
        m={5}
        ml={10}
        dangerouslySetInnerHTML={{
          __html: event.event._def.extendedProps.details,
        }}
      />
    </Box>
  );
});
