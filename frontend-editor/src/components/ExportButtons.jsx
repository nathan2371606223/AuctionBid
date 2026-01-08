import React, { useState } from "react";
import { exportCsv } from "../services/api";

export default function ExportButtons({ token }) {
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await exportCsv(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auction_players_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("导出失败");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <h1>导出数据</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleExportCsv} disabled={exporting}>
          {exporting ? "导出中..." : "导出为CSV（包含完整出价历史）"}
        </button>
      </div>
      <div style={{ fontSize: "14px", color: "#666" }}>
        <p>导出的CSV文件包含所有球员信息和每个球员的完整出价历史。</p>
      </div>
    </div>
  );
}
