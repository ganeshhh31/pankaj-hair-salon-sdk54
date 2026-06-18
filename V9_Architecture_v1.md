# Project Pankaj V9 Architecture (Revised)

## Tech Stack

- React Native
- Expo SDK 54
- TypeScript
- AsyncStorage
- Firebase (V10 Ready)

## State Management

- Context API

## Navigation

- Expo Router

## User Roles

- Owner
- Worker

## Permissions

### Owner

- Full Access
- Manage Workers
- Manage Services
- Manage Expenses
- Generate Reports
- Perform Day Close
- Manage Settlements
- Approve Login Requests

### Worker

- View Own Dashboard
- Manage Own Transactions
- Manage Own Expenses
- View Own Attendance
- View Own Settlements
- Cannot Access Other Worker Data

## Folder Structure

app/
├── \_layout.tsx
├── auth/
├── owner/
└── worker/

components/
constants/
context/
hooks/
services/
storage/
types/
utils/

## Navigation Blueprint

Splash Screen
↓
Mobile Number Screen
↓
Role Selection

├── Owner Login
│ ↓
│ Owner Dashboard
│
└── Worker Login
↓
Worker Dashboard

### Owner Navigation

Dashboard
Workers
Services
Expenses
Reports
Analytics
Settings

### Worker Navigation

Check In
Dashboard
Add Transaction
Add Expense
My Transactions
My Expenses
Settlement
History
Check Out

## Core Data Models

### Owner

ownerId
name
phone
pin
role
status
createdAt

### Worker

workerId
name
phone
status
joinDate
role

### Service

serviceId
serviceName
price
category
isActive
createdAt
updatedAt

### Transaction

transactionId
workerId
serviceId
amount
paymentMode
createdBy
timestamp
status

### Expense

expenseId
workerId
amount
category
description
paymentMode
createdBy
timestamp
status

### Attendance

attendanceId
workerId
status
checkInTime
checkOutTime
date

### Settlement

settlementId
workerId
collectionAmount
sharePercentage
settlementAmount
status
timestamp

## Payment Modes

CASH

UPI

CARD

BANK_TRANSFER

## Transaction Status

ACTIVE

VOID

SETTLED

## Attendance State Machine

INACTIVE
↓
ACTIVE
↓
CHECKED_OUT
↓
SETTLED

### State Definitions

INACTIVE

- Worker has not checked in

ACTIVE

- Worker checked in
- Can add transactions
- Can add expenses

CHECKED_OUT

- Worker checked out
- Cannot add transactions
- Cannot add expenses

SETTLED

- Settlement completed
- Day closed

### Attendance Rules

1. Worker must Check In before adding transactions.
2. Worker must Check In before adding expenses.
3. Worker cannot Check Out twice.
4. Worker cannot add transactions after Check Out.
5. Worker cannot add expenses after Check Out.
6. Settlement only allowed after Check Out.
7. Day Close generates pending settlements.

## Worker Login Flow

Worker
↓
Enter Mobile Number
↓
Login Request Created
↓
Owner Approval Required
↓
Owner Enters PIN
↓
Access Granted
↓
Worker Dashboard

### Login Request Model

requestId
workerId
phone
status
requestedAt
approvedBy
approvedAt

### Login Request States

PENDING

APPROVED

REJECTED

EXPIRED

### Login Rules

1. Worker cannot access dashboard without approval.
2. Owner can approve login requests.
3. Owner can reject login requests.
4. Login request expires after configured timeout.
5. Approved worker session remains active until logout.
6. Worker can only access his own data.

## Settlement Logic

Worker Collection
×
Commission Percentage
=====================

Settlement Amount

### Settlement Calculation Model

totalCollection
totalExpenses
commissionPercentage
grossSettlement
netSettlement

### Settlement Status

PENDING

PARTIALLY_PAID

PAID

### Settlement Rules

1. Settlement can only happen after Check Out.
2. Settlement is calculated from worker collection.
3. Commission percentage is configurable.
4. Settlement record is permanent.
5. Settled transactions cannot be modified.
6. Day Close can auto-generate settlements.
7. Owner can manually settle workers.

## Day Close Workflow

Owner Initiates Day Close
↓
Validate Active Workers
↓
Force Check Out Remaining Workers
↓
Generate Settlements
↓
Generate Daily Report
↓
Lock Day
↓
Day Closed

### Day Status

OPEN

CLOSED

REOPENED

### Day Close Rules

1. Day Close can only be performed by Owner.
2. All active workers must be checked out.
3. Pending settlements must be generated.
4. Daily report must be created.
5. Closed day data becomes read-only.
6. Reopening a closed day requires Owner permission.

### Daily Report Model

reportId
date
totalCollection
cashCollection
onlineCollection
totalExpenses
totalSettlements
workerCount
generatedAt
generatedBy

## Expense Management

### Expense Categories

SALON

PRODUCT

UTILITY

MAINTENANCE

SALARY

MARKETING

OTHER

### Expense Status

ACTIVE

DELETED

### Expense Rules

1. Expense amount must be greater than zero.
2. Expense must have a category.
3. Expense must have timestamp.
4. Expense creator must be recorded.
5. Deleted expenses must be logged.
6. Closed-day expenses cannot be modified.
7. Owner can view all expenses.
8. Worker can view only own expenses.

## Service Management

### Service Categories

HAIRCUT

BEARD

FACIAL

HAIR_COLOR

HAIR_SPA

OTHER

### Service Rules

1. Service name must be unique.
2. Service price must be greater than zero.
3. Inactive services cannot be selected for new transactions.
4. Existing transactions keep historical service pricing.
5. Only Owner can create services.
6. Only Owner can edit service pricing.
7. Only Owner can deactivate services.

## Application Settings

commissionPercentage

dayCloseTime

allowWorkerExpense

allowWorkerTransactionEdit

loginRequestExpiry

currency

## V9 Implementation Notes

### Routing

Project uses Expo Router.

### State Management

Context API

### Local Storage

AsyncStorage

### Future Backend

Firebase Firestore

### Development Strategy

Offline First

Firebase Sync Later
