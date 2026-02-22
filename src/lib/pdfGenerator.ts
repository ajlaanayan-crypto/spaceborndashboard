import { TaskData } from "@/services/taskService";

export const generateWeeklyReport = async (tasks: TaskData[], userName: string) => {
    // Dynamically import jsPDF and autoTable to avoid SSR build errors
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Spaceborn Weekly Mission Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${today}`, 14, 30);
    doc.text(`Admin: ${userName}`, 14, 35);

    // Summary Section
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Executive Summary", 14, 50);

    doc.setFontSize(11);
    doc.text(`Total Missions: ${totalTasks}`, 14, 60);
    doc.text(`Completed: ${completedTasks}`, 60, 60);
    doc.text(`In Progress: ${inProgressTasks}`, 110, 60);
    doc.text(`Completion Rate: ${completionRate}%`, 160, 60);

    // Table
    const tableData = tasks.map(t => [
        t.title,
        t.assignedToName || t.groupName || 'Unassigned',
        t.status.toUpperCase().replace('_', ' '),
        t.priority.toUpperCase(),
        t.deadline
    ]);

    // use autoTable helper
    autoTable(doc, {
        startY: 70,
        head: [['Mission', 'Assigned To', 'Status', 'Priority', 'Deadline']],
        body: tableData,
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9 },
        margin: { top: 70 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Spaceborn Internal Report - Confidential - Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`Spaceborn_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
