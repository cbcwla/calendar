const regex = /\d+(\.\d+)?/g;
const timeRegex = /([上下]午)?(\d+)點?/g

const dateParser = {
    parseEventDate: (dateInfo, actStartDate, actEndDate) => {},
};

/*
* @input
* description: e.g. 提前2周-3天, 提前10天,提前5周
* actStartDate: start of the activity
* actEndDate: end of the activity
* @output
* start and end of the event
* {
    *   start: LocaleDateString
    *   end: LocaleDateString
* }
*/
export const beforeActivityDateParser = {
    parseDescription: (description) => {
        let relativeDays = description.replace(/(\d+)周/g, function(match, weeks) {
            let days = weeks * 7;
            return days + "天";
        });
        relativeDays = description.replace(/(\d+)個月/g, function(match, months) {
            let days = months * 30;
            return days + "天";
        });

        let nums = relativeDays.match(regex)
        nums = nums.map( n => parseInt(n)).sort((a, b) => b-a)
        return nums
    },
    parseEventDate: (description, actStartDate, actEndDate) => {
        let eventStart = new Date(actStartDate)
        let eventEnd = new Date(actStartDate)
        const nums = beforeActivityDateParser.parseDescription(description)
        eventStart.setDate(eventStart.getDate()-nums[0])
        nums.length == 2 ? eventEnd.setDate(eventEnd.getDate()-nums[1]) : eventEnd.setDate(eventEnd.getDate()-nums[0])
        if (eventStart.getTime() === eventEnd.getTime()) {
            eventEnd.setDate(eventEnd.getDate()+1)
        }
        let times = parseEventTime(description)
        if (times.length == 2) {
            setEventTime(eventStart, eventEnd, times)
            return formatDateTime(eventStart, eventEnd)
        }
        return formatDate(eventStart, eventEnd)
    },
}

/*
* @input
* description: e.g. 活动第一天下午3點-6點,活动第一天下午3-6點,活动第一天上午6點-下午6點,活动最後一天上午6點-下午6點
* actStartDate: start of the activity
* actEndDate: end of the activity
* @output
* start and end of the event
* {
    *   start: LocaleDateString
    *   end: LocaleDateString
* }
*/
export const duringActivityDateParser = {
    wordMap: {"第一":0, "第二":1, "第三":2, "第四":3, "第五":4, "第六":5, "第七":6, "第八":7, "第九":8, "第十":9},
    parseEventDate: (description, actStartDate, actEndDate) => {
        let eventStart = new Date(actStartDate)
        let eventEnd = new Date(actStartDate)

        // parse 第x天
        let dayStart = description.indexOf("第")
        let dayEnd = description.indexOf("天")
        if (dayStart != -1 && dayEnd != -1 && dayEnd > dayStart) {
            let daySub = duringActivityDateParser.wordMap[description.substring(dayStart, dayEnd)]
            eventStart.setDate(eventStart.getDate() - daySub)
            eventEnd.setDate(eventEnd.getDate() - daySub)
            setEventTime(eventStart, eventEnd, parseEventTime(description))
            return formatDateTime(eventStart, eventEnd)
        }

        // parse 最后
        if (description.includes("最後")) {
            eventStart.setDate(actEndDate.getDate())
            eventEnd.setDate(actEndDate.getDate())
            setEventTime(eventStart, eventEnd, parseEventTime(description))
            return formatDateTime(eventStart, eventEnd)
        }

        if (description.includes("活動期間")) {
            eventStart.setDate(actStartDate.getDate())
            eventEnd.setDate(actEndDate.getDate())
            if (description.includes("1周內")) {
                eventEnd.setDate(actEndDate.getDate()+1+(7 - actEndDate.getDay()-1) % 7)
            } else if(description.includes("的周日")) {
                eventStart.setDate(actStartDate.getDate()+(7 - actStartDate.getDay()) % 7)
                eventEnd.setDate(eventStart.getDate())
            }
            return formatDate(eventStart, eventEnd)
        }

        if (description == "活動後1周內") {
            eventStart.setDate(actEndDate.getDate()+1)
            eventEnd.setDate(actEndDate.getDate()+1+(7 - actEndDate.getDay()-1) % 7)
            return formatDate(eventStart, eventEnd)
        }

    },

}

const parseEventTime = (timeStr) => {
    timeStr = timeStr.trim()
    if (!timeStr.includes("點")) {
        return []
    }
    const times = timeStr.match(timeRegex)
    const startTime = times[0]
    const endTime = times[1]

    const startHour = parseInt(startTime.replace(/[^0-9]/g, ''))
    const endHour = parseInt(endTime.replace(/[^0-9]/g, ''))

    const startSuffix = startTime.includes('下午') ? 'PM' : 'AM'
    const endSuffix = (endTime.includes('下午') || (!endTime.includes('下午') && startTime.includes('下午')))? 'PM' : 'AM'

    const start = startHour + (startSuffix === 'PM' ? 12 : 0)

    const end = endHour + (endSuffix === 'PM'  ? 12 : 0)

    return [start, end]
}
const setEventTime = (eventStart, eventEnd, times) => {
    if(times.length == 2) {
        eventStart.setHours(times[0])
        eventEnd.setHours(times[1])
    }
}

const formatDate = (eventStart, eventEnd) => {
    return { start: eventStart.toLocaleString("en-US",{month: '2-digit', day: '2-digit', year: 'numeric'}),
        end: eventEnd.toLocaleString("en-US", {month: '2-digit', day: '2-digit', year: 'numeric'})}
}

const formatDateTime = (eventStart, eventEnd) => {
    const options = {
        timeZone: "America/Los_Angeles",
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return { start: eventStart.toLocaleString("en-US", options),
        end: eventEnd.toLocaleString("en-US", options)}
}

export const parseActivityDate = (dateStr) => {
    const currentYear= new Date().getFullYear()
    if (dateStr == null || dateStr.length == 0) {
        return null
    }
    const date = new Date(dateStr)
    date.setFullYear(currentYear)
    return date
}

