$DB_URL = "postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

$indexes = @(
  "CREATE INDEX IF NOT EXISTS idx_attendance_pupil_id   ON attendance(pupil_id)",
  "CREATE INDEX IF NOT EXISTS idx_attendance_date        ON attendance(date DESC)",
  "CREATE INDEX IF NOT EXISTS idx_attendance_pupil_date  ON attendance(pupil_id, date DESC)",
  "CREATE INDEX IF NOT EXISTS idx_marks_pupil_id         ON marks(pupil_id)",
  "CREATE INDEX IF NOT EXISTS idx_marks_recorded_at      ON marks(recorded_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_pupil_parents_pupil_id  ON pupil_parents(pupil_id)",
  "CREATE INDEX IF NOT EXISTS idx_pupil_parents_parent_id ON pupil_parents(parent_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_school_id        ON users(school_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_role             ON users(role)",
  "CREATE INDEX IF NOT EXISTS idx_users_status           ON users(status)",
  "CREATE INDEX IF NOT EXISTS idx_pupils_school_id       ON pupils(school_id)",
  "CREATE INDEX IF NOT EXISTS idx_pupils_class_id        ON pupils(class_id)",
  "CREATE INDEX IF NOT EXISTS idx_pupils_active          ON pupils(active) WHERE active = true",
  "CREATE INDEX IF NOT EXISTS idx_classes_school_id      ON classes(school_id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_pupil_id  ON notifications(pupil_id)",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp   ON audit_logs(timestamp DESC)",
  "CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id    ON audit_logs(actor_id)",
  "CREATE INDEX IF NOT EXISTS idx_parents_school_id      ON parents(school_id)"
)

$total = $indexes.Count
$i = 1
foreach ($sql in $indexes) {
  Write-Host "[$i/$total] $sql" -ForegroundColor Cyan
  supabase db query --db-url $DB_URL $sql
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED on: $sql" -ForegroundColor Red
    exit 1
  }
  $i++
}

Write-Host "`nAll $total indexes created successfully!" -ForegroundColor Green
