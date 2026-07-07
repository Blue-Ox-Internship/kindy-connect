# Bugfix Requirements Document

## Introduction

This document addresses three critical bugs in the Kindy Connect application that significantly impact security, performance, and reliability:

1. **Critical Security Vulnerability**: The `loginUser` function bypasses password verification, allowing unauthorized access to any account with just a valid user ID
2. **Performance Issue**: The `addPupil` function experiences slow save operations, particularly with foreign IDs and complex parent relationships
3. **Notification System Failure**: Attendance notifications are marked as "sent" in the database without actual SMS or email delivery to parents

These bugs pose serious risks to system security, user experience, and operational reliability. The fixes must ensure proper authentication, acceptable performance, and reliable notification delivery while preserving all existing functionality.

## Bug Analysis

### Bug 1: Authentication Password Bypass (CRITICAL SECURITY)

#### Current Behavior (Defect)

1.1 WHEN a user attempts to log in with a valid user ID and any password (or no password) THEN the system authenticates the user without verifying the password

1.2 WHEN the loginUser function receives a request with only an ID parameter THEN the system queries the database using only `WHERE id = ${id}` without password comparison

1.3 WHEN an attacker knows or guesses a valid user ID THEN the system grants full access to that user's account regardless of password input

#### Expected Behavior (Correct)

2.1 WHEN a user attempts to log in with a valid user ID and correct password THEN the system SHALL verify both the user ID and password match before granting access

2.2 WHEN a user attempts to log in with a valid user ID but incorrect password THEN the system SHALL return null or an authentication error without granting access

2.3 WHEN the loginUser function receives a request THEN the system SHALL accept both `id` and `password` parameters and validate both against the database

2.4 WHEN password verification is performed THEN the system SHALL use secure password comparison (constant-time comparison to prevent timing attacks)

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN a teacher with status "pending" or "rejected" attempts to log in THEN the system SHALL CONTINUE TO deny access even with correct credentials

3.2 WHEN a user with role "admin", "deputy", or "super_admin" logs in successfully THEN the system SHALL CONTINUE TO grant access regardless of status field

3.3 WHEN a user provides a non-existent user ID THEN the system SHALL CONTINUE TO return null without revealing whether the ID exists

3.4 WHEN a database error occurs during login THEN the system SHALL CONTINUE TO log the error and throw an exception

### Bug 2: Slow Pupil Save Operation

#### Current Behavior (Defect)

1.5 WHEN a pupil record with a foreign ID is saved THEN the system takes an unusually long time to complete the operation (more than 2 seconds)

1.6 WHEN the addPupil function executes with complex parent relationships THEN the system sometimes fails or times out during the database transaction

1.7 WHEN parent creation happens inside the pupil save transaction THEN the system experiences delays due to foreign key constraint validation

1.8 WHEN multiple INSERT operations occur within a single transaction THEN the system performance degrades significantly

#### Expected Behavior (Correct)

2.5 WHEN a pupil record is saved with any valid data (including foreign IDs) THEN the system SHALL complete the save operation in under 2 seconds

2.6 WHEN the addPupil function executes THEN the system SHALL successfully save the pupil record without timeouts or transaction failures

2.7 WHEN parent relationships are created THEN the system SHALL optimize the transaction to minimize foreign key validation delays

2.8 WHEN multiple database operations are required THEN the system SHALL use optimized queries or batch operations to improve performance

#### Unchanged Behavior (Regression Prevention)

3.5 WHEN a pupil is added without complete parent information THEN the system SHALL CONTINUE TO throw an error "Parent / guardian details are required"

3.6 WHEN a pupil is successfully added THEN the system SHALL CONTINUE TO create an audit log entry with the action "Created pupil"

3.7 WHEN a pupil is added with multiple existing parent IDs THEN the system SHALL CONTINUE TO link all parents to the pupil in the pupil_parents junction table

3.8 WHEN a pupil record is saved THEN the system SHALL CONTINUE TO return the complete pupil object with all parent IDs

3.9 WHEN a database error occurs during pupil save THEN the system SHALL CONTINUE TO roll back the transaction and throw an error

### Bug 3: Notifications Marked as Sent Without Delivery

#### Current Behavior (Defect)

1.9 WHEN attendance is recorded (arrival or departure) THEN the system inserts notification records with status "sent" without actually transmitting SMS or email

1.10 WHEN the markArrival function executes THEN the system creates SMS and email notification records marked as "sent" but no API calls are made to SMS or email services

1.11 WHEN the markDeparture function executes THEN the system creates SMS and email notification records marked as "sent" but no API calls are made to SMS or email services

1.12 WHEN environment variables VITE_SMS_API_KEY and VITE_EMAIL_API_KEY exist in configuration THEN the system does not use them to send actual notifications

#### Expected Behavior (Correct)

2.9 WHEN attendance is recorded and notification records are created THEN the system SHALL attempt to send actual SMS and email notifications via configured APIs

2.10 WHEN an SMS notification is successfully delivered via the API THEN the system SHALL mark the notification status as "sent"

2.11 WHEN an SMS notification fails to deliver via the API THEN the system SHALL mark the notification status as "failed" and log the error

2.12 WHEN an email notification is successfully delivered via the API THEN the system SHALL mark the notification status as "sent"

2.13 WHEN an email notification fails to deliver via the API THEN the system SHALL mark the notification status as "failed" and log the error

2.14 WHEN SMS or email API credentials are not configured THEN the system SHALL either skip notification delivery or mark them as "failed" with appropriate error messaging

#### Unchanged Behavior (Regression Prevention)

3.10 WHEN attendance is marked for arrival THEN the system SHALL CONTINUE TO create notification records for all parents linked to the pupil

3.11 WHEN attendance is marked for departure THEN the system SHALL CONTINUE TO create notification records for all parents linked to the pupil

3.12 WHEN a notification message is generated THEN the system SHALL CONTINUE TO use the format "Dear {parent.name}, your child {pupil.firstName} {pupil.lastName} has [arrived safely at school|left school] today at {time}."

3.13 WHEN attendance is recorded THEN the system SHALL CONTINUE TO create audit log entries with actions "Marked arrival" or "Marked departure"

3.14 WHEN attendance notifications fail to send THEN the system SHALL CONTINUE TO complete the attendance recording operation (notification failure should not block attendance recording)
