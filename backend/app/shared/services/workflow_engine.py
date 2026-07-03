"""
WorkflowEngine — the shared approval engine.

Methods to implement (after admin workflow UI is built):
  WorkflowEngine.start()     — called on request submit; creates approval_requests row + notifies step 1 approver
  WorkflowEngine.approve()   — approver approves current step; advances to next or completes workflow
  WorkflowEngine.reject()    — terminates workflow, notifies requester, no resubmit
  WorkflowEngine.return_()   — returns to requester for revision; requester can resubmit (new attempt)
  WorkflowEngine.audit()     — writes to workflow_audit_trail; called by all the above

All DB writes happen inside the caller's transaction. Email is sent after commit.
"""

# TODO: implement after admin workflow UI is complete and workflows/steps
#       can be configured in the database.
