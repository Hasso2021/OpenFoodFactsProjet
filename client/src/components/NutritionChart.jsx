import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Simple bar chart comparing key nutrients per 100g
 */
export default function NutritionChart({ nutriments, title = 'Nutrition per 100g' }) {
  if (!nutriments) return null;

  const labels = [];
  const values = [];

  const nutrients = [
    { key: 'energy-kcal_100g', label: 'Energy (kcal)' },
    { key: 'fat_100g', label: 'Fat (g)' },
    { key: 'sugars_100g', label: 'Sugars (g)' },
    { key: 'proteins_100g', label: 'Proteins (g)' },
    { key: 'salt_100g', label: 'Salt (g)' },
  ];

  nutrients.forEach(({ key, label }) => {
    if (nutriments[key] != null) {
      labels.push(label);
      values.push(Number(nutriments[key]));
    }
  });

  if (labels.length === 0) return null;

  const data = {
    labels,
    datasets: [
      {
        label: 'Amount',
        data: values,
        backgroundColor: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, color: '#1b4332' },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e8f5e9' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="nutrition-chart">
      <Bar data={data} options={options} />
    </div>
  );
}
