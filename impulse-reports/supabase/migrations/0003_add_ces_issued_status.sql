-- Add CES Issued as a job status
alter type job_status add value if not exists 'ces_issued';
