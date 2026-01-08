import React, { useState, useEffect } from "react";

export default function TeamSelector({ teamsByLevel, loading, value, onChange }) {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    if (value && teamsByLevel && Object.keys(teamsByLevel).length > 0) {
      // Find which level contains this team
      let found = false;
      for (const level in teamsByLevel) {
        const team = teamsByLevel[level].find((t) => t.name === value);
        if (team) {
          setSelectedLevel(level);
          setSelectedTeam(value);
          found = true;
          break;
        }
      }
      if (!found) {
        setSelectedLevel("");
        setSelectedTeam("");
      }
    } else {
      setSelectedTeam("");
      setSelectedLevel("");
    }
  }, [value, teamsByLevel]);

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setSelectedTeam("");
    onChange("");
  };

  const handleTeamChange = (teamName) => {
    setSelectedTeam(teamName);
    onChange(teamName);
  };

  const availableTeams = selectedLevel ? teamsByLevel[selectedLevel] || [] : [];

  if (loading) {
    return <div style={{ padding: "5px", color: "#666" }}>加载中...</div>;
  }

  return (
    <div>
      <select
        value={selectedLevel}
        onChange={(e) => handleLevelChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "8px",
          touchAction: "manipulation",
          WebkitAppearance: "menulist-button"
        }}
        aria-label="选择级别"
      >
        <option value="" disabled>
          请选择级别
        </option>
        <option value="1">级别 1</option>
        <option value="2">级别 2</option>
        <option value="3">级别 3</option>
      </select>
      <select
        value={selectedTeam}
        onChange={(e) => handleTeamChange(e.target.value)}
        disabled={!selectedLevel}
        style={{
          width: "100%",
          padding: "8px",
          touchAction: "manipulation",
          WebkitAppearance: "menulist-button"
        }}
        aria-label="选择球队"
      >
        <option value="">选择球队</option>
        {availableTeams.map((team) => (
          <option key={team.id} value={team.name}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
