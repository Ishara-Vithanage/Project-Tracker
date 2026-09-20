# Project Tracker

**Project Tracker** is a cloud-native, serverless web application designed to streamline project allocation, resource utilization, and progress tracking across software development teams. The platform empowers engineering managers and department heads to monitor delivery milestones, evaluate developer bandwidth, and extract operational analytics.

---

## Key Features

- **Project & Task Management:** Create projects, break down deliverables into sub-tasks, and assign developers.
- **Progress Tracking & Analytics:** Real-time dashboards visualizing milestone completion and sprint health.
- **Resource & Availability Metrics:** Measure developer workload and capacity to prevent bottlenecks.
- **Automated Email Notifications:** Amazon SES/SNS alerts for task assignments, status updates, and deadline reminders.
- **Role-Based Access Control (RBAC):** Granular authorization for Department Heads, Project Managers, and Developers.

---

## System Architecture

The application is built on a 100% serverless, cost-optimized AWS architecture:

```
[ Client Browser ]
       │
       ▼ (HTTPS)
[ Amazon S3 (Static Hosting) ]
       │
       ├──────────────────────────────────────────┐
       │ (Authentication)                         │ (API Requests / JWT Token)
       ▼                                          ▼
[ Amazon Cognito User Pool ]            [ Amazon API Gateway (HTTP API) ]
                                                  │
                                                  ▼ (Proxy Integration / JWT Authorizer)
                                        [ AWS Lambda (Python 3.12 / ARM64) ]
                                                  │
                                                  ▼
                                        [ Amazon DynamoDB Tables ]
                                        (Users, Projects, Tasks)
```

### AWS Infrastructure Components

| Layer | Service | Role & Functionality |
| :--- | :--- | :--- |
| **Frontend Hosting** | Amazon S3 | Hosts statically exported Next.js build artifacts with edge caching and SSL termination. |
| **Authentication** | Amazon Cognito | Manages user sign-up/sign-in, token issuance (JWT), and role-based access levels. |
| **API Gateway** | Amazon API Gateway (HTTP API) | Low-latency REST router mapping endpoints to the serverless compute layer. |
| **Compute** | AWS Lambda | Python 3.12 execution engine running on Graviton2 (ARM64) for cost and execution efficiency. |
| **Database** | Amazon DynamoDB | Fully managed, auto-scaling NoSQL database with dedicated tables for `Users`, `Projects`, and `Tasks`. |
| **CI/CD** | AWS CodePipeline / CodeBuild | Automated build and deployment pipeline pulling from source control to S3 and Lambda. |

---

## Data Model (DynamoDB)

* **`Users` Table:** `id` (Partition Key), `name`, `email`, `role` (`Manager`, `Developer`, `DepartmentHead`), `capacity`
* **`Projects` Table:** `id` (Partition Key), `title`, `description`, `status`, `managerId`, `deadline`, `createdAt`
* **`Tasks` Table:** `id` (Partition Key), `projectId` (GSI), `assignedTo`, `title`, `priority`, `status`, `dueDate`

---

## Getting Started

### Prerequisites
- Node.js 18+ & npm/yarn
- AWS CLI configured with appropriate IAM permissions
- Python 3.12 (for local backend testing)

### Local Frontend Setup

```bash
# 1. Clone repository
git clone [https://github.com/your-username/project-tracker.git](https://github.com/your-username/project-tracker.git)
cd project-tracker/frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env.local)
NEXT_PUBLIC_API_BASE_URL=[https://your-api-id.execute-api.us-east-1.amazonaws.com](https://your-api-id.execute-api.us-east-1.amazonaws.com)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# 4. Run local development server
npm run dev
```

### Build & Static Export

```bash
# Generate static HTML/CSS/JS export for Amazon S3
npm run build
```

---

## Deployment Workflow

1. **Frontend:** Push changes to the `main` branch → **AWS CodePipeline** triggers **AWS CodeBuild** (`npm run build`) → Uploads `/out` artifacts to **Amazon S3** → Invalidates 
2. **Backend:** Packaged Python handler deployed to **AWS Lambda** integrated with **HTTP API Gateway** and **DynamoDB**.

## Screenshots

<img width="683" height="301" alt="login" src="https://github.com/user-attachments/assets/491361c3-cc95-46f4-ac91-4c4b5d5019d2" /><img width="683" height="301" alt="home" src="https://github.com/user-attachments/assets/9897e9bf-38e5-49ee-9bd8-84d0193ffbcd" />

