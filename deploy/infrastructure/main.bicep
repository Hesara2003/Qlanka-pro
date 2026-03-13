@description('The location for all resources. Use a region that supports the Free Tier Postgres Flexible server, ex: eastus')
param location string = resourceGroup().location

@description('The name prefix for all resources.')
param baseName string = 'qlanka'

@description('The administrator login name for the PostgreSQL server.')
param dbAdminLogin string = 'qlankaadmin'

@description('The administrator login password for the PostgreSQL server. Must contain upper, lower, numbers, and special chars.')
@secure()
param dbAdminPassword string

// ==========================================
// 1. Container Registry (Basic Tier)
// ==========================================
resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: '${baseName}acr${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Basic' // Cheapest tier available (~$5/month)
  }
  properties: {
    adminUserEnabled: true // Allows ACA to pull images using admin credentials easily
  }
}

// ==========================================
// 2. PostgreSQL Flexible Server (Free Tier Eligible)
// ==========================================
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${baseName}-dbserver'
  location: location
  sku: {
    name: 'Standard_B1ms' // Burstable tier - Eligible for 12 months free on Azure for Students
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: dbAdminLogin
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32 // Within the free limit
    }
    highAvailability: {
      mode: 'Disabled' // Keep costs at $0
    }
  }
}

// Configure firewall to allow Azure services to connect
resource postgresFirewall_AllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServicesAndResourcesWithinIG'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Configure logical microservice databases inside the server
resource identityDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'identity_db'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

resource serviceCenterDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'servicecenters_db'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

resource queueDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'queue_db'
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// ==========================================
// 3. Azure Container Apps Environment
// ==========================================
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${baseName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${baseName}-appinsights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${baseName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

output acrLoginServer string = acr.properties.loginServer
output postgresServerName string = postgresServer.name
output environmentId string = containerAppEnv.id
