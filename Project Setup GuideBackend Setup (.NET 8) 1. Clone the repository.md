**Project Setup Guide (Backend \+ Frontend)**

Follow these steps to run the project locally.

**Prerequisites**

Make sure you have the following installed:

* Git  
* Node.js  
* Microsoft SQL Server  
* Visual Studio 2022 or heigher  
* VS Code (or Cursor / any editor)  
* .NET 8 SDk https://dotnet.microsoft.com/en-us/download/dotnet/8.0

# **Backend Setup (.NET 8\)**

### **1\. Clone the repository**

git clone [https://github.com/mazenabdelgawad700/MedScanAI.git](https://github.com/mazenabdelgawad700/MedScanAI.git)

### **2\. Configure the database**

* Navigate to:

MedScanAI.API/appsettings.json

* Update the connection string if needed:

"ConnectionStrings": {  
 "DefaultConnection": "Server=.;Database=MedScanAI;Integrated Security=True;TrustServerCertificate=True;"  
}

`Server=.` means your local SQL Server instance.

Make sure:

* SQL Server is running  
* Windows Authentication is enabled

### **3\. Install dependencies**

Open **Visual Studio**, then:

* Go to:  
   `Tools → NuGet Package Manager → Package Manager Console`  
* Select:

   Default Project → MedScanAI.API

* Run:

dotnet restore

### **4\. Apply database migrations**

* Change **Default Project** to:

   MedScanAI.Infrastructure

* Run:

Update-Database

This will create the database and apply all migrations.

### **5\. Run the backend**

Start the project using Visual Studio.

Swagger will be available at:

* HTTP:

   http://localhost:7196/swagger/index.html

* HTTPS:

   [https://localhost:7196/swagger](https://localhost:7196/swagger)/index.html

# **Frontend Setup (React \+ Vite)**

### **1\. Clone the repository**

git clone https://github.com/mazenabdelgawad700/MedScanAIFrontEnd.git

### **Install dependencies**

Navigate to the project folder:

cd MedScanAIFrontEnd

cd medscanai

Then run:

npm install

### **3\. Run the frontend**

npm run dev

You should see something like:

VITE ready

Local: http://localhost:5173/

# **Test Accounts (Seeded Data)**

You can use the following accounts to test the system:

### **Admin**

* Email: `mazenabdelgawad700@gmail.com`  
* Password: `String@1234`

### **Doctor**

* Email: `ali@gmail.com`  
* Password: `String@1234`

### **Patient**

* Email: `malak@gmail.com`  
* Password: `String@1234`

## **Final note**

If something doesn’t work:

* Make sure SQL Server is running  
* Re-run `Update-Database`  
* Check that ports (7196 / 5173\) are not already in use

