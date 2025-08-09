-- MSSQL Schema for User Management

-- Drop table if exists to avoid conflicts
IF OBJECT_ID('user', 'U') IS NOT NULL
DROP TABLE [user];

-- Create user table
CREATE TABLE [user] (
  [id] INT NOT NULL IDENTITY(1,1),
  [username] NVARCHAR(50) NOT NULL,
  [password] NVARCHAR(255) NOT NULL,
  PRIMARY KEY ([id]),
  CONSTRAINT [username_UNIQUE] UNIQUE ([username])
);

-- Add comments to table and columns
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'用户信息表' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'user';
