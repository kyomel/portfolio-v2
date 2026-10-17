---
title: "U-Net Architecture"
termSlug: "u-net-architecture"
year: 2026
month: 6
monthName: "June"
day: 3
order: 3
source: "2026/june-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/june-term.md"
excerpt: "U-Net is a convolutional neural network designed for image segmentation — the task of classifying every single pixel in an image. Its signature \"U\" shape combines a contracting path (which captures..."
---
### Definition:

U-Net is a convolutional neural network designed for image segmentation — the task of classifying every single pixel in an image. Its signature "U" shape combines a contracting path (which captures what is in the image) with an expanding path (which pinpoints where it is), linked by skip connections that preserve fine details.

In one sentence: U-Net takes an image in and spits out a same-sized map where each pixel gets a label.

Analogy — The Artist's Two-Step Process
Imagine an artist painting a detailed landscape from a blurry photo:

Step What happens U-Net Equivalent
1️⃣ Squinting Steps back, squints, sees the big shapes — "There's a mountain, a lake, some trees" Contracting path (Encoder) — captures high-level what
2️⃣ Zooming in Leans in close, fills in the edges, restores sharp boundaries — "The shoreline goes exactly here" Expanding path (Decoder) — recovers precise where
🔗 Cross-checking Glances back at the original photo constantly so no detail is lost Skip connections — shuttle fine details from early layers to later layers
Without the skip connections (cross-checking), you'd get a blurry blob. With them, you get sharp, pixel-perfect boundaries.

### Example:

U-Net in PyTorch (Simplified)

```
This is a clean, minimal U-Net for binary segmentation (e.g., "cell vs. background"):

import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    """Two convolutions + batch norm + ReLU (the basic building block)."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)

class UNet(nn.Module):
    def __init__(self, in_channels=1, out_channels=1):
        super().__init__()

        # ── Encoder (contracting path) ──
        self.enc1 = DoubleConv(in_channels, 64)    # 572 → 570
        self.enc2 = DoubleConv(64, 128)            #    → 140
        self.enc3 = DoubleConv(128, 256)           #    →  68
        self.enc4 = DoubleConv(256, 512)           #    →  32

        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

        # ── Bottleneck ──
        self.bottleneck = DoubleConv(512, 1024)    #    →  28

        # ── Decoder (expanding path) ──
        self.up4 = nn.ConvTranspose2d(1024, 512, kernel_size=2, stride=2)
        self.dec4 = DoubleConv(1024, 512)          # 512(skip) + 512(up)

        self.up3 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.dec3 = DoubleConv(512, 256)           # 256(skip) + 256(up)

        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec2 = DoubleConv(256, 128)           # 128(skip) + 128(up)

        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec1 = DoubleConv(128, 64)            # 64(skip) + 64(up)

        # ── Output ──
        self.out_conv = nn.Conv2d(64, out_channels, kernel_size=1)

    def forward(self, x):
        # Encoder
        e1 = self.enc1(x)                          # [B,  64, H,   W]
        e2 = self.enc2(self.pool(e1))              # [B, 128, H/2, W/2]
        e3 = self.enc3(self.pool(e2))              # [B, 256, H/4, W/4]
        e4 = self.enc4(self.pool(e3))              # [B, 512, H/8, W/8]

        # Bottleneck
        b = self.bottleneck(self.pool(e4))         # [B, 1024, H/16, W/16]

        # Decoder with skip connections
        d4 = self.up4(b)                           # [B, 512, H/8, W/8]
        d4 = torch.cat([d4, e4], dim=1)            # Skip! → [B, 1024, H/8, W/8]
        d4 = self.dec4(d4)

        d3 = self.up3(d4)                          # [B, 256, H/4, W/4]
        d3 = torch.cat([d3, e3], dim=1)            # Skip! → [B, 512, H/4, W/4]
        d3 = self.dec3(d3)

        d2 = self.up2(d3)                          # [B, 128, H/2, W/2]
        d2 = torch.cat([d2, e2], dim=1)            # Skip! → [B, 256, H/2, W/2]
        d2 = self.dec2(d2)

        d1 = self.up1(d2)                          # [B, 64, H, W]
        d1 = torch.cat([d1, e1], dim=1)            # Skip! → [B, 128, H, W]
        d1 = self.dec1(d1)

        return self.out_conv(d1)                   # [B, out_ch, H, W]

# ── Usage Example ──
model = UNet(in_channels=3, out_channels=1)       # RGB in, binary mask out
dummy_image = torch.randn(1, 3, 572, 572)          # batch of 1, 572×572 RGB
mask = model(dummy_image)

print(f"Input shape:  {dummy_image.shape}")        # [1, 3, 572, 572]
print(f"Output shape: {mask.shape}")               # [1, 1, 572, 572]  ← same spatial size!
```
