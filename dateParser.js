const regex = /\d+(\.\d+)?/g;

const dateParser = {
    parseEventDate: (dateInfo, actStartDate, actEndDate) => {},
};

// example of supported date format
//提前2周-3天
//提前10天
//提前5周
export const beforeActivityDateParser = {
    parseRelativeDates: (relativeDate) => {
        let relativeDays = relativeDate.replace(/(\d+)周/g, function(match, weeks) {
            let days = weeks * 7;
            return days + "天";
        });

        let nums = relativeDays.match(regex)
        nums = nums.map( n => parseInt(n)).sort((a, b) => b-a)
        return nums
    },
    parseEventDate: (dateInfo, actStartDate, actEndDate) => {
        let eventStart = new Date(actStartDate)
        let eventEnd = new Date(actStartDate)
        const nums = beforeActivityDateParser.parseRelativeDates(dateInfo)
        eventStart.setDate(eventStart.getDate()-nums[0])
        nums.length == 2 ? eventEnd.setDate(eventEnd.getDate()-nums[1]) : eventEnd.setDate(eventEnd.getDate()-nums[0])
        if (eventStart.getTime() === eventEnd.getTime()) {
            eventEnd.setDate(eventEnd.getDate()+1)
        }
        return formatDate(eventStart, eventEnd)
    },
}

// example of supported date format
//活动第一天下午3點-6點
//活动第一天下午3-6點
//活动第一天上午6點-下午6點
//活动最後一天上午6點-下午6點
export const duringActivityDateParser = {
    wordMap: {"第一":0, "第二":1, "第三":2, "第四":3, "第五":4, "第六":5, "第七":6, "第八":7, "第九":8, "第十":9},
    parseEventDate: (dateInfo, actStartDate, actEndDate) => {
        let eventStart = new Date(actStartDate)
        let eventEnd = new Date(actStartDate)

        // parse 第x天
        let dayStart = dateInfo.indexOf("第")
        let dayEnd = dateInfo.indexOf("天")
        if (dayStart != -1 && dayEnd != -1 && dayEnd > dayStart) {
            let daySub = duringActivityDateParser.wordMap[dateInfo.substring(dayStart, dayEnd)]
            eventStart.setDate(eventStart.getDate() - daySub)
            eventEnd.setDate(eventEnd.getDate() - daySub)
            duringActivityDateParser.setEventTime(eventStart, eventEnd, duringActivityDateParser.parseEventTime(dateInfo.substring(dayEnd+1)))
            return formatDate(eventStart, eventEnd)
        }

        // parse 最后
        if (dateInfo.includes("最後")) {
            eventStart.setDate(actEndDate.getDate())
            eventEnd.setDate(actEndDate.getDate())
            duringActivityDateParser.setEventTime(eventStart, eventEnd, duringActivityDateParser.parseEventTime(dateInfo.substring(dayEnd+1)))
            return formatDate(eventStart, eventEnd)
        }
    },
    parseEventTime: (timeStr) => {
        timeStr = timeStr.trim()
        const timeRegex = /([上下]午)?(\d+)點?/g
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
    },
    setEventTime: (eventStart, eventEnd, times) => {
        eventStart.setHours(times[0])
        eventEnd.setHours(times[1])
    }
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

const formatDate = (eventStart, eventEnd) => {
    return { start: eventStart.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
        end: eventEnd.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}
}