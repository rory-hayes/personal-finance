import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const demoData = [
  { month: 'Jan', netWorth: 1000 },
  { month: 'Feb', netWorth: 1200 },
  { month: 'Mar', netWorth: 1400 },
  { month: 'Apr', netWorth: 1600 },
  { month: 'May', netWorth: 1850 },
  { month: 'Jun', netWorth: 2100 },
];

function calculateSavings(monthly: number, rate: number, years: number) {
  const months = years * 12;
  const monthlyRate = rate / 100 / 12;
  let total = 0;
  for (let i = 0; i < months; i++) {
    total = (total + monthly) * (1 + monthlyRate);
  }
  return total;
}

const LandingPage: React.FC = () => {
  const [monthly, setMonthly] = useState(200);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(5);

  const projected = calculateSavings(monthly, rate, years);

  return (
    <div className="font-sans text-gray-800">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Take Control of Your Financial Future</h1>
        <p className="text-lg sm:text-xl mb-8">Track spending, plan goals and watch your wealth grow.</p>
        <a
          href="/app"
          className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-md shadow hover:bg-gray-100 transition"
        >
          Launch App
        </a>
      </section>

      {/* Demo */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={demoData} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="netWorth" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Savings Calculator</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Monthly Contribution ($)</label>
              <input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="mt-1 w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Annual Interest Rate (%)</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-1 w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Years</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-1 w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="font-semibold pt-2">
              Projected Savings: ${projected.toFixed(0)}
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">Professional Analytics</h3>
            <p className="text-gray-600">Powerful charts and insights to keep your finances on track.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Automated Intelligence</h3>
            <p className="text-gray-600">Smart suggestions help you save more without thinking.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">All Your Money, One Place</h3>
            <p className="text-gray-600">Accounts, investments and goals together in a single dashboard.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center mb-8">What People Are Saying</h2>
        <div className="space-y-6">
          <blockquote className="bg-white p-6 rounded-lg shadow">
            "A&R Tracker turned my messy finances into an organized plan." – Jamie R.
          </blockquote>
          <blockquote className="bg-white p-6 rounded-lg shadow">
            "The charts and projections make it easy to stay motivated." – Casey L.
          </blockquote>
        </div>
        <p className="text-center mt-6 text-sm text-gray-500">Featured in Money Weekly &amp; The Ledger</p>
      </section>

      {/* Pricing */}
      <section className="bg-gray-100 py-16 px-4">
        <h2 className="text-2xl font-semibold text-center mb-10">Simple Pricing</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Personal Finance Starter</h3>
            <p className="text-gray-600 mb-4">Everything you need to build good habits.</p>
            <div className="text-3xl font-bold mb-6">Free</div>
            <a href="/app" className="mt-auto inline-block bg-blue-600 text-white px-5 py-3 rounded-md hover:bg-blue-700 transition text-center">Get Started</a>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Wealth Builder Pro</h3>
            <p className="text-gray-600 mb-4">Advanced planning tools for serious savers.</p>
            <div className="text-3xl font-bold mb-6">$5/mo</div>
            <a href="/app" className="mt-auto inline-block bg-blue-600 text-white px-5 py-3 rounded-md hover:bg-blue-700 transition text-center">Start Free Trial</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
