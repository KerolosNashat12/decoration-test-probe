import { palette } from '../theme';

interface TrendPoint {
  date: string;
  count: number;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const PADDING_Y = 10;

// A small dependency-free area/line chart. Builds an SVG `path` from a
// normalized set of points â no chart library needed for a single sparkline.
export function TrendChart({ data, color = palette.primaryActive }: { data: TrendPoint[]; color?: string }) {
  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data.map((point) => point.count), 1);
  const usableHeight = CHART_HEIGHT - PADDING_Y * 2;

  const points = data.map((point, index) => {
    const x = data.length === 1 ? CHART_WIDTH / 2 : (index / (data.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - PADDING_Y - (point.count / max) * usableHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)},${CHART_HEIGHT} L ${firstPoint.x.toFixed(2)},${CHART_HEIGHT} Z`;

  const gradientId = 'trend-chart-gradient';

  return (
    <div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.textTertiary, marginTop: 4 }}>
        <span>{formatDate(data[0].date)}</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
