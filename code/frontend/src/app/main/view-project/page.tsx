'use client';

import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { useUser } from '@/app/context/userProvider';
import { useRefresh } from '@/app/context/appWrapper';
import { GetProjectbyManager, GetProject } from '@/services/projectinfo';
import { GetProjectbyDeveloper } from '@/services/projectinfo';
import { useRouter } from 'next/navigation';
import NoProjects from './not-found';
import { jsPDF } from 'jspdf';

export default function ViewProject() {
  const { user } = useUser();
  const { refreshKey } = useRefresh();
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [ownershipFilter, setOwnershipFilter] = useState<'My Projects' | 'All Projects'>('My Projects');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.userID) return;

      try {
        let data: any[] = [];
        if (user.role === 'MGR' || user.role === 'HEAD') {
          if (ownershipFilter === 'My Projects') {
            data = await GetProjectbyManager(user.userID);
          } else {
            data = await GetProject();
          }
        } else {
          data = await GetProjectbyDeveloper(user.userID);
        }

        setProjects(data);

        // Re-apply current search & status filter on fresh data — do NOT clear them
        const lower = searchTerm.toLowerCase();
        let filtered = lower
          ? data.filter((p: any) =>
            p.name.toLowerCase().includes(lower) ||
            (p.manager && p.manager.toLowerCase().includes(lower))
          )
          : [...data];
        if (selectedStatus) {
          filtered = filtered.filter(
            (p: any) => p.status.toUpperCase() === selectedStatus.toUpperCase()
          );
        }
        setFilteredProjects(filtered);
        console.log('Projects fetched:', data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user?.userID, ownershipFilter, refreshKey]);

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "NOT STARTED":
        return styles.statusNotStarted;
      case "IN PROGRESS":
        return styles.statusInProgress;
      case "UAT":
        return styles.statusUAT;
      case "ON HOLD":
        return styles.statusOnHold;
      case "LIVE":
        return styles.statusLive;
      default:
        return '';
    }
  };

  const handleSearch = (term: string) => {
    const lower = term.toLowerCase();
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(lower) ||
      (project.manager && project.manager.toLowerCase().includes(lower))
    );
    applyFilters(filtered, selectedStatus);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    applyFilters(projects, status);
  };

  const handleSort = () => {
    const order = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(order);
    const sorted = [...filteredProjects].sort((a, b) => {
      const dateA = new Date(a.createDate).getTime();
      const dateB = new Date(b.createDate).getTime();
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setFilteredProjects(sorted);
  };

  const applyFilters = (baseList = projects, status = selectedStatus) => {
    let list = [...baseList];
    if (status) {
      list = list.filter(project => project.status.toUpperCase() === status.toUpperCase());
    }
    setFilteredProjects(list);
  };

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const tableWidth = pageWidth - margin * 2;
    const headerHeight = 70;

    // ── Load logo as base64 ──────────────────────────────────────────────────
    let logoBase64: string | null = null;
    try {
      const response = await fetch('/reportLogo.png');
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      console.warn('Could not load report logo');
    }

    // ── Header bar (light background) ───────────────────────────────────────
    // Light background so the black logo text is clearly visible
    doc.setFillColor(248, 250, 252);        // slate-50
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Accent bottom border on header
    doc.setFillColor(30, 41, 59);           // slate-800
    doc.rect(0, headerHeight - 3, pageWidth, 3, 'F');

    // Logo (left-aligned, vertically centred in header)
    if (logoBase64) {
      const logoH = 44;
      const logoW = logoH * 2.2;           // approximate aspect ratio
      doc.addImage(logoBase64, 'PNG', margin, (headerHeight - logoH) / 2, logoW, logoH);
    }

    // Report title (centre)
    doc.setTextColor(30, 41, 59);          // slate-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PROJECT REPORT', pageWidth / 2, headerHeight / 2 + 6, { align: 'center' });

    // Generated date (top-right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);       // slate-500
    const generatedOn = `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    doc.text(generatedOn, pageWidth - margin, headerHeight / 2 + 6, { align: 'right' });


    // ── Column definitions ───────────────────────────────────────────────────
    const colWidths = [
      tableWidth * 0.20,  // Project Name
      tableWidth * 0.15,  // Manager
      tableWidth * 0.25,  // Developers
      tableWidth * 0.13,  // Create Date
      tableWidth * 0.13,  // Finish Date
      tableWidth * 0.14,  // Status
    ];
    const colHeaders = ['PROJECT NAME', 'MANAGER', 'DEVELOPERS', 'CREATE DATE', 'FINISH DATE', 'STATUS'];
    const rowHeight = 28;
    const colHeaderH = 32;
    let startY = headerHeight + 10;

    // Helper to compute X positions
    const colX = (idx: number) => margin + colWidths.slice(0, idx).reduce((a, b) => a + b, 0);

    // Status colour mapping
    const statusColor = (status: string): [number, number, number] => {
      switch (status.toUpperCase()) {
        case 'NOT STARTED': return [209, 213, 219];
        case 'IN PROGRESS': return [96, 165, 250];
        case 'UAT': return [167, 139, 250];
        case 'ON HOLD': return [251, 146, 60];
        case 'LIVE': return [52, 211, 153];
        default: return [203, 213, 225];
      }
    };

    // ── Table header ────────────────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);       // gray-50
    doc.rect(margin, startY, tableWidth, colHeaderH, 'F');
    doc.setDrawColor(226, 232, 240);       // slate-200
    doc.rect(margin, startY, tableWidth, colHeaderH, 'S');

    doc.setTextColor(71, 85, 105);         // slate-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    colHeaders.forEach((h, i) => {
      doc.text(h, colX(i) + 8, startY + colHeaderH / 2 + 3);
    });

    startY += colHeaderH;

    // ── Table rows ───────────────────────────────────────────────────────────
    filteredProjects.forEach((project, rowIdx) => {
      const developers = project.tasks
        ? Array.from(new Set(project.tasks.map((t: any) => t.developer).filter(Boolean))).join(', ')
        : '';
      const devText = developers || 'Unassigned';
      const createDateText = project.createDate
        ? new Date(project.createDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';
      const finishDateText = project.finishDate
        ? new Date(project.finishDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

      // Measure wrapped developer text height
      const devLines = doc.splitTextToSize(devText, colWidths[2] - 16);
      const dynamicHeight = Math.max(rowHeight, devLines.length * 13 + 10);

      // Page break if needed
      if (startY + dynamicHeight > pageHeight - margin) {
        doc.addPage();
        startY = margin;
        // Re-draw header on new page
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, startY, tableWidth, colHeaderH, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, startY, tableWidth, colHeaderH, 'S');
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        colHeaders.forEach((h, i) => {
          doc.text(h, colX(i) + 8, startY + colHeaderH / 2 + 3);
        });
        startY += colHeaderH;
      }

      // Alternating row background
      if (rowIdx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, startY, tableWidth, dynamicHeight, 'F');

      // Row border
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, startY, tableWidth, dynamicHeight, 'S');

      // Cell text
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const nameLines = doc.splitTextToSize(project.name.toUpperCase(), colWidths[0] - 16);
      doc.text(nameLines, colX(0) + 8, startY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const mgr = project.manager || 'N/A';
      const mgrLines = doc.splitTextToSize(mgr, colWidths[1] - 16);
      doc.text(mgrLines, colX(1) + 8, startY + 16);

      doc.setTextColor(30, 41, 59);
      doc.text(devLines, colX(2) + 8, startY + 16);

      doc.setTextColor(71, 85, 105);
      doc.text(createDateText, colX(3) + 8, startY + 16);
      doc.text(finishDateText, colX(4) + 8, startY + 16);

      // Status pill
      const [r, g, b] = statusColor(project.status);
      const pillX = colX(5) + 8;
      const pillY = startY + dynamicHeight / 2 - 9;
      const pillW = colWidths[5] - 16;
      doc.setFillColor(r, g, b);
      doc.roundedRect(pillX, pillY, pillW, 18, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(project.status.toUpperCase(), pillX + pillW / 2, pillY + 12, { align: 'center' });

      startY += dynamicHeight;
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }

    doc.save('Project_Report.pdf');
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.main_container}>
      <h1>VIEW PROJECTS</h1>
      <div className={styles.form}>
        <div className={styles.inputLine}>
          <input
            className={styles.inputSearch}
            type="text"
            placeholder="Search by project name or manager..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          <button onClick={handleSort} style={{ marginLeft: '20px' }}>
            SORT ({sortOrder.toUpperCase()})
          </button>
          <button
            onClick={generatePDF}
            className={styles.generateReportBtn}
            title="Download project report as PDF"
          >
            ⬇ GENERATE REPORT
          </button>
        </div>

        <div className={styles.filterRow}>
          <label className={styles.filterLabel}>FILTER BY STATUS: </label>
          <select className={styles.filterSelect} onChange={(e) => handleStatusFilter(e.target.value)} value={selectedStatus}>
            <option value="">All</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="UAT">UAT</option>
            <option value="On Hold">On Hold</option>
            <option value="Live">Live</option>
          </select>

          {(user?.role === 'MGR' || user?.role === 'HEAD') && (
            <div style={{ marginLeft: '20px', display: 'inline-block' }}>
              <label className={styles.filterLabel}>PROJECTS: </label>
              <select className={styles.filterSelect} onChange={(e) => setOwnershipFilter(e.target.value as any)} value={ownershipFilter}>
                <option value="My Projects">My Projects</option>
                <option value="All Projects">All Projects</option>
              </select>
            </div>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <NoProjects />
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.styledTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Manager</th>
                  <th>Developers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => {
                  // Extract developers from tasks, removing duplicates and empty values
                  const developers = project.tasks
                    ? Array.from(new Set(project.tasks.map((task: any) => task.developer).filter(Boolean)))
                    : [];

                  return (
                    <tr key={index}>
                      <td className={styles.projectNameTd}>{project.name.toUpperCase()}</td>
                      <td className={styles.managerTd}>{project.manager || 'N/A'}</td>
                      <td>
                        <div className={styles.developersList}>
                          {developers.length > 0 ? (
                            developers.map((dev: any, i) => (
                              <span key={i} className={styles.developerBadge}>{dev}</span>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={`${styles.labelprojectStatus} ${getStatusClass(project.status)}`}>
                          {project.status.toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <button
                          className={styles.moreDetailsBtn}
                          onClick={() => router.push(`/main/project-details?projectID=${project.p_ID}`)}
                        >
                          MORE {'>>'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
