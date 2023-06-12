import { parseMdFile, YEAR } from './parseMd'

const main = async () => {
  const tree = await parseMdFile(year)
  const activities = await yearActivities(year)
  const events = _.flatten(await Promise.all(_.map(activities, async (activity) => {
    const tree = await parseMdFile(activity.type)
    return parseActivity(_.merge({ year }, activity), tree)
  })))

  console.log(JSON.stringify(events, null, 2))
}
main()

