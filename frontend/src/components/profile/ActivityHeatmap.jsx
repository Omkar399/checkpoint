import CalendarHeatmap from 'react-calendar-heatmap'
import { Tooltip } from 'react-tooltip'
import 'react-calendar-heatmap/dist/styles.css'

function getColorClass(count) {
  if (!count || count === 0) return 'fill-[var(--bg-tertiary)]'
  if (count === 1) return 'fill-emerald-800'
  if (count <= 3) return 'fill-emerald-600'
  if (count <= 5) return 'fill-emerald-400'
  return 'fill-emerald-300'
}

export default function ActivityHeatmap({ data = [], year }) {
  const currentYear = year || new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1)
  const endDate = new Date(currentYear, 11, 31)

  return (
    <div>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={data}
        classForValue={(value) => {
          if (!value) return 'fill-[var(--bg-tertiary)]'
          return getColorClass(value.count)
        }}
        tooltipDataAttrs={(value) => {
          if (!value || !value.date) return {}
          return {
            'data-tooltip-id': 'heatmap-tooltip',
            'data-tooltip-content': `${value.date}: ${value.count || 0} check-in${(value.count || 0) !== 1 ? 's' : ''}`,
          }
        }}
        showWeekdayLabels
      />
      <Tooltip id="heatmap-tooltip" />
    </div>
  )
}
