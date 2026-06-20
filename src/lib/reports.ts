/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

export interface AssessmentData {
  id: string;
  created_at: string;
  total_emissions: number;
  scope_1: number;
  scope_2: number;
  scope_3: number;
  category_breakdown?: {
    transport: number;
    energy: number;
    diet: number;
    shopping: number;
    waste: number;
  };
}

export function getReportData(assessments: any[] | null): AssessmentData[] {
  if (!assessments || assessments.length === 0) {
    return [];
  }
  
  return assessments.map(a => ({
    id: a.id,
    created_at: a.created_at,
    total_emissions: Number(a.total_emissions),
    scope_1: Number(a.scope_1) || 0,
    scope_2: Number(a.scope_2) || 0,
    scope_3: Number(a.scope_3) || 0,
    category_breakdown: a.responses?.category_breakdown || {
      transport: 0,
      energy: 0,
      diet: 0,
      shopping: 0,
      waste: 0
    }
  })).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function generateWeeklyReportPDF(assessments: any[] | null) {
  const data = getReportData(assessments);
  if (data.length === 0) return;
  
  const latest = data[data.length - 1];
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110); // Teal 700
  doc.text('CarbonWise Weekly Report', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  const weekStart = new Date(new Date(latest.created_at).getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(latest.created_at);
  doc.text(`Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`, 14, 30);
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`Total Emissions: ${latest.total_emissions.toFixed(2)} kg CO2e`, 14, 45);

  autoTable(doc, {
    startY: 55,
    head: [['Category', 'Emissions (kg CO2e)']],
    body: [
      ['Transport', latest.category_breakdown?.transport?.toFixed(2) || '0.00'],
      ['Energy', latest.category_breakdown?.energy?.toFixed(2) || '0.00'],
      ['Food', latest.category_breakdown?.diet?.toFixed(2) || '0.00'],
      ['Shopping', latest.category_breakdown?.shopping?.toFixed(2) || '0.00'],
      ['Waste', latest.category_breakdown?.waste?.toFixed(2) || '0.00'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110] }, // Teal 700
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  
  doc.setFontSize(14);
  doc.setTextColor(15, 118, 110);
  doc.text('Recommendation:', 14, finalY + 15);
  doc.setFontSize(12);
  doc.setTextColor(0);
  
  let maxCat = 'transport';
  let maxVal = latest.category_breakdown?.transport || 0;
  if ((latest.category_breakdown?.energy || 0) > maxVal) { maxCat = 'energy'; maxVal = latest.category_breakdown!.energy; }
  if ((latest.category_breakdown?.diet || 0) > maxVal) { maxCat = 'food'; maxVal = latest.category_breakdown!.diet; }
  
  if (maxCat === 'transport') {
    doc.text('Reduce car travel by 15% to significantly lower your transport emissions.', 14, finalY + 25);
  } else if (maxCat === 'energy') {
    doc.text('Consider switching to LED bulbs or lowering your thermostat by 1 degree.', 14, finalY + 25);
  } else {
    doc.text('Try replacing one meat-based meal with a plant-based alternative this week.', 14, finalY + 25);
  }

  doc.save('CarbonWise_Weekly_Report.pdf');
}

export function generateMonthlyReportPDF(assessments: any[] | null) {
  const data = getReportData(assessments);
  if (data.length === 0) return;
  
  const latest = data[data.length - 1];
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110); // Teal 700
  doc.text('CarbonWise Monthly Report', 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  const monthStart = new Date(new Date(latest.created_at).getFullYear(), new Date(latest.created_at).getMonth(), 1);
  doc.text(`Month: ${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 14, 30);
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Total Footprint Summary', 14, 45);

  autoTable(doc, {
    startY: 55,
    head: [['Scope', 'Emissions (kg CO2e)']],
    body: [
      ['Scope 1 (Direct)', latest.scope_1.toFixed(2)],
      ['Scope 2 (Energy)', latest.scope_2.toFixed(2)],
      ['Scope 3 (Value Chain)', latest.scope_3.toFixed(2)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110] },
  });

  let finalY = (doc as any).lastAutoTable.finalY || 100;

  if (data.length > 1) {
    doc.setFontSize(16);
    doc.text('Carbon Trend (Last Assessments)', 14, finalY + 15);
    
    const trendData = data.slice(-5).map(a => [
      new Date(a.created_at).toLocaleDateString(),
      a.total_emissions.toFixed(2)
    ]);

    autoTable(doc, {
      startY: finalY + 25,
      head: [['Date', 'Total Emissions']],
      body: trendData,
      theme: 'grid',
      headStyles: { fillColor: [20, 83, 45] }, // Green 900
    });
    finalY = (doc as any).lastAutoTable.finalY || 150;
  }

  doc.setFontSize(14);
  doc.setTextColor(15, 118, 110);
  doc.text('Recommendations & Reduction Potential:', 14, finalY + 15);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('- Switch to a renewable energy provider (Potential: -15% Scope 2)', 14, finalY + 25);
  doc.text('- Use public transit for daily commutes (Potential: -20% Scope 1)', 14, finalY + 32);

  doc.save('CarbonWise_Monthly_Report.pdf');
}

export function exportToCSV(assessments: any[] | null) {
  const data = getReportData(assessments);
  if (data.length === 0) return;
  
  const csvData = data.map(a => ({
    Date: new Date(a.created_at).toLocaleDateString(),
    Total_Emissions_kg: a.total_emissions.toFixed(2),
    Scope_1_kg: a.scope_1.toFixed(2),
    Scope_2_kg: a.scope_2.toFixed(2),
    Scope_3_kg: a.scope_3.toFixed(2),
    Transport_kg: a.category_breakdown?.transport?.toFixed(2) || 0,
    Energy_kg: a.category_breakdown?.energy?.toFixed(2) || 0,
    Diet_kg: a.category_breakdown?.diet?.toFixed(2) || 0,
    Shopping_kg: a.category_breakdown?.shopping?.toFixed(2) || 0,
    Waste_kg: a.category_breakdown?.waste?.toFixed(2) || 0,
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "CarbonWise_Report.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Daily Logs to CSV
export function exportDailyLogsToCSV(logs: any[]) {
  if (!logs || logs.length === 0) return;
  const csvData = logs.map(l => ({
    Date: l.log_date,
    Total_Emissions_kg: Number(l.total_emissions).toFixed(2),
    Transport_Emissions_kg: Number(l.transport_emissions).toFixed(2),
    Electricity_Emissions_kg: Number(l.electricity_emissions).toFixed(2),
    Food_Emissions_kg: Number(l.food_emissions).toFixed(2),
    Waste_Emissions_kg: Number(l.waste_emissions).toFixed(2),
    Commute_Miles: l.raw_inputs?.transportMiles || 0,
    Fuel_Type: l.raw_inputs?.transportType || '',
    Electricity_kWh: l.raw_inputs?.electricityKwh || 0,
    Diet_Type: l.raw_inputs?.dietType || '',
    Waste_kg: l.raw_inputs?.wasteKg || 0,
    Recycling_kg: l.raw_inputs?.recyclingKg || 0,
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "CarbonWise_Daily_Logs.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate Daily Logs PDF Report
export function generateDailyLogsReportPDF(logs: any[]) {
  if (!logs || logs.length === 0) return;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110);
  doc.text('CarbonWise Daily Logs Audit', 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = logs.slice(0, 15).map(l => [
    l.log_date,
    Number(l.transport_emissions).toFixed(1) + ' kg',
    Number(l.electricity_emissions).toFixed(1) + ' kg',
    Number(l.food_emissions).toFixed(1) + ' kg',
    Number(l.waste_emissions).toFixed(1) + ' kg',
    Number(l.total_emissions).toFixed(1) + ' kg'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Transport', 'Electricity', 'Diet/Food', 'Waste', 'Total CO2e']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110] },
  });

  doc.save('CarbonWise_Daily_Logs_Report.pdf');
}


