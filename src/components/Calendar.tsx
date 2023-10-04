import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Box, Text, usePopper } from "@chakra-ui/react";
import { forwardRef, useState } from "react";
import { EventHoveringArg, EventSourceInput } from "@fullcalendar/core";
import { EventImpl } from "@fullcalendar/core/internal";
import React from "react";

export const Calendar = ({ events }: { events: EventSourceInput }) => {
  const [focusedEvent, setFocusedEvent] = useState<EventImpl | null>();

  const { popperRef, referenceRef } = usePopper({
    placement: "bottom",
  });

  const handleEventMouseEnter = ({ event, el }: EventHoveringArg) => {
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

const DetailPopup = forwardRef<HTMLDivElement, { event: EventImpl }>(
  ({ event }, ref) => {
    const sourceEvent = event._def.extendedProps; // this is our original event object
    const { tags, details } = sourceEvent;
    const departments = tags?.dept?.split(",");

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
        <Text
          color="gray.900"
          fontWeight="bold"
          backgroundColor="gray.100"
          p={2}
        >
          {event.title}
        </Text>
        {departments && <Text m={5}>{departments.join(" ")}</Text>}
        <Box
          m={5}
          ml={10}
          dangerouslySetInnerHTML={{
            __html: details,
          }}
        />
      </Box>
    );
  }
);
