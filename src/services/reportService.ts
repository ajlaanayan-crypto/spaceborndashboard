import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaskData } from './taskService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Legacy types consumed by admin/users/[userId]/page.tsx ──────────────────
export interface ReportData {
    id: string;
    userId: string;
    period: string;
    performanceScore: number;
    tasksCompleted: number;
    tasksAssigned: number;
    remarks?: string;
}

export interface FeedbackData {
    id: string;
    userId: string;
    message: string;
    type: 'praise' | 'improvement' | 'general';
    createdByName?: string;
    createdAt?: any;
}

export const getReportsByUser = async (userId: string): Promise<ReportData[]> => {
    try {
        const q = query(collection(db, 'reports'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReportData));
    } catch {
        return [];
    }
};

export const getFeedbackForUser = async (userId: string): Promise<FeedbackData[]> => {
    try {
        const q = query(collection(db, 'feedback'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackData));
    } catch {
        return [];
    }
};


// ─── Logo Loader ──────────────────────────────────────────────────────────────
const loadLogoDataUrl = (): Promise<string | null> =>
    new Promise((resolve) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(null); return; }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(null);
            img.src = '/images/logo.jpg';
        } catch {
            resolve(null);
        }
    });

// ─── Watermark (tiled light text, no GState needed) ──────────────────────────
const addWatermark = (doc: jsPDF) => {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(42);
    doc.setFont('helvetica', 'bold');
    // Very light grey — simulates transparency without GState
    doc.setTextColor(230, 232, 240);

    const stepX = 80;
    const stepY = 60;
    for (let x = -20; x < pw + stepX; x += stepX) {
        for (let y = 20; y < ph + stepY; y += stepY) {
            doc.text('SPACEBORN', x, y, { angle: 45 });
        }
    }
    // Reset colour after watermark
    doc.setTextColor(0, 0, 0);
};

// ─── Page 1 Header ────────────────────────────────────────────────────────────
const drawFirstPageHeader = (
    doc: jsPDF,
    logoDataUrl: string | null,
    weekLabel: string
) => {
    const pw = doc.internal.pageSize.getWidth();

    // Dark banner
    doc.setFillColor(10, 14, 28);
    doc.rect(0, 0, pw, 46, 'F');

    // Blue accent stripe
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 46, pw, 2.5, 'F');

    // Logo image (top-right)
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', pw - 44, 7, 32, 32);
        } catch {
            // skip silently
        }
    }

    // Company name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('SPACEBORN', 14, 21);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 185, 225);
    doc.text('BEYOND AUTONOMOUS', 14, 30);

    // Report type label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('PROGRESS REPORT', 14, 39);

    // Report title row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(18, 24, 44);
    doc.text('Weekly Mission Performance Audit', 14, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 115, 145);
    doc.text(`Period : ${weekLabel}`, 14, 68);
    doc.text(`Issued  : ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}`, 14, 74);
};

// ─── Continuation page header ─────────────────────────────────────────────────
const drawContinuationHeader = (doc: jsPDF) => {
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(10, 14, 28);
    doc.rect(0, 0, pw, 15, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 15, pw, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 205, 240);
    doc.text('SPACEBORN  ·  MISSION INTELLIGENCE UNIT', 14, 10.5);
};

// ─── Per-page footer (called last so it draws OVER the watermark) ─────────────
const drawFooter = (doc: jsPDF, page: number, total: number) => {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.4);
    doc.line(14, ph - 19, pw - 14, ph - 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(190, 50, 50);
    doc.text('CONFIDENTIAL', 14, ph - 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 135, 165);
    doc.text('FOR AUTHORIZED SPACEBORN PERSONS ONLY', 14, ph - 8);

    doc.setTextColor(120, 135, 165);
    doc.text(`Page ${page} / ${total}`, pw - 14, ph - 10, { align: 'right' });
};

// ─── Pie/Donut chart via canvas → addImage ────────────────────────────────────
const drawPieChartImage = async (
    doc: jsPDF,
    x: number,
    y: number,
    size: number,
    slices: { name: string; count: number; color: string }[]
): Promise<void> => {
    const total = slices.reduce((s, g) => s + g.count, 0);
    if (total === 0) return;

    const px = 300; // canvas pixel size
    const canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d')!;

    const cx = px / 2;
    const cy = px / 2;
    const outerR = px / 2 - 8;
    const innerR = outerR * 0.45;

    let angle = -Math.PI / 2;
    slices.forEach((s) => {
        const sweep = (s.count / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, angle, angle + sweep);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        // Gap between slices
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        angle += sweep;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const dataUrl = canvas.toDataURL('image/png');
    doc.addImage(dataUrl, 'PNG', x, y, size, size);
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const generateWeeklyReportPDF = async (
    tasks: TaskData[],
    weekLabel: string,
    groupStats: { name: string; count: number; color: string }[]
) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();

    // Load logo
    const logoDataUrl = await loadLogoDataUrl();

    // ── PAGE 1 ──────────────────────────────────────────────────────────
    // Watermark first (drawn below content)
    addWatermark(doc);
    drawFirstPageHeader(doc, logoDataUrl, weekLabel);

    // KPI table
    const total = tasks.length;
    const verified = tasks.filter(t => t.status === 'completed').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const active = tasks.filter(t => ['in_progress', 'pending'].includes(t.status)).length;
    const rate = total === 0 ? '0%' : `${Math.round((verified / total) * 100)}%`;

    autoTable(doc, {
        startY: 80,
        head: [['Metric', 'Value', 'Metric', 'Value']],
        body: [
            ['Total Missions', String(total), 'Verified ✓', String(verified)],
            ['In Review', String(review), 'Active', String(active)],
            ['Completion Rate', rate, 'Groups', String(groupStats.length)],
        ],
        theme: 'grid',
        headStyles: {
            fillColor: [10, 14, 28],
            textColor: [200, 215, 240],
            fontStyle: 'bold',
            fontSize: 9,
        },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 247, 255] },
    });

    const afterKPI = (doc as any).lastAutoTable.finalY + 10;

    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(18, 24, 44);
    doc.text('Group Contribution Distribution', 14, afterKPI);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, afterKPI + 2.5, 90, afterKPI + 2.5);

    // Pie chart
    const chartSize = 52;
    await drawPieChartImage(doc, 14, afterKPI + 6, chartSize, groupStats);

    // Legend
    const legendX = 72;
    const legendStartY = afterKPI + 10;
    const totalCount = groupStats.reduce((s, g) => s + g.count, 0);
    groupStats.forEach((g, i) => {
        const pct = totalCount === 0 ? 0 : Math.round((g.count / totalCount) * 100);
        // Colour swatch
        const [rr, gg, bb] = [
            parseInt(g.color.slice(1, 3), 16),
            parseInt(g.color.slice(3, 5), 16),
            parseInt(g.color.slice(5, 7), 16),
        ];
        doc.setFillColor(rr, gg, bb);
        doc.roundedRect(legendX, legendStartY + i * 9 - 2.5, 5, 5, 1, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(50, 60, 80);
        doc.text(`${g.name}  —  ${g.count} missions (${pct}%)`, legendX + 7, legendStartY + i * 9 + 1.5);
    });

    // ── PAGE 2 ──────────────────────────────────────────────────────────
    doc.addPage();
    addWatermark(doc);
    drawContinuationHeader(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(18, 24, 44);
    doc.text('Granular Mission Log', 14, 26);

    autoTable(doc, {
        startY: 30,
        head: [['#', 'Mission Title', 'Assignee / Group', 'Priority', 'Status']],
        body: tasks.map((t, idx) => [
            idx + 1,
            t.title ?? '—',
            t.assignedToName || t.groupName || 'Individual',
            (t.priority ?? '—').toUpperCase(),
            (t.status ?? '—').toUpperCase().replace('_', ' '),
        ]),
        headStyles: {
            fillColor: [10, 14, 28],
            textColor: [200, 215, 240],
            fontStyle: 'bold',
            fontSize: 8.5,
        },
        styles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: {
            0: { cellWidth: 9 },
            3: { cellWidth: 18 },
            4: { cellWidth: 22 },
        },
        didParseCell: (data: any) => {
            if (data.section !== 'body' || data.column.index !== 4) return;
            const v = String(data.cell.raw);
            if (v === 'COMPLETED') data.cell.styles.textColor = [22, 163, 74];
            else if (v === 'REVIEW') data.cell.styles.textColor = [147, 51, 234];
            else data.cell.styles.textColor = [37, 99, 235];
        },
    });

    // Signature block
    const ph = doc.internal.pageSize.getHeight();
    const sigY = Math.min((doc as any).lastAutoTable.finalY + 18, ph - 55);

    doc.setDrawColor(190, 200, 220);
    doc.setLineWidth(0.3);
    doc.line(14, sigY + 18, 100, sigY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(70, 85, 115);
    doc.text('AUTHORIZED SIGNATORY', 14, sigY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 65, 95);
    doc.text('Mohammad Ayan  |  COO, SPACEBORN', 14, sigY + 30);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 120, 160);
    doc.text('Digitally Signed', 14, sigY + 36);

    // ── Footers on all pages ─────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages);
    }

    doc.save(`Spaceborn_Weekly_Audit_${weekLabel.replace(/[/ ]/g, '_')}.pdf`);
};
