local Players = game:GetService("Players")

local player = Players.LocalPlayer
local gui = Instance.new("ScreenGui")
gui.Name = "BlackScreen"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = player:WaitForChild("PlayerGui")

local frame = Instance.new("Frame")
frame.Size = UDim2.fromScale(1, 1)
frame.Position = UDim2.fromScale(0, 0)
frame.BackgroundColor3 = Color3.new(0, 0, 0)
frame.BorderSizePixel = 0
frame.Parent = gui
