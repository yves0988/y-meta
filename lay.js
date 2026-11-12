
/* User list layout */
.user {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: #f1f5f9;
  color: #222;
}

/* Green online indicator */
.status-dot {
  width: 10px;
  height: 10px;
  min-width: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* Online */
.status-dot.online {
  background: #22c55e;
}

/* Offline */
.status-dot.offline {
  background: #94a3b8;
}

/* Status text */
.status-text {
  margin-left: auto;
  font-size: 11px;
  color: #64748b;
}

/* Selected user */
.user.active {
  background: #dbeafe;
}

/* Hover */
.user:hover {
  background: #e2e8f0;
}
