---
title: "Eager Loading"
termSlug: "eager-loading"
year: 2025
month: 7
monthName: "July"
day: 8
order: 7
source: "2025/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2025/july-term.md"
excerpt: "Eager Loading is a technique where data or resources are loaded immediately when they are declared or referenced, rather than waiting until they are actually needed. This approach prioritizes upfro..."
---
### Definition:

Eager Loading is a technique where data or resources are loaded immediately when they are declared or referenced, rather than waiting until they are actually needed. This approach prioritizes upfront loading to ensure data is readily available when accessed.

- **Eager Loading vs Lazy Loading**
  |Aspect |Eager Loading |Lazy Loading |
  |--- |--- |--- |
  |Loading Time |Load immediately/upfront |Load when needed |
  |Memory Usage |Higher initial memory consumption |Lower initial memory usage |
  |Performance |Faster access after loading |Slower first access, faster subsequent |
  |Network Requests |More upfront requests |Fewer initial requests |
  |Use Case |Critical data needed immediately |Optional/conditional data |

### Example:

- Database Query

```
# Eager Loading Example - SQLAlchemy
from sqlalchemy.orm import joinedload

# Load user with all their posts immediately
user = session.query(User)\
    .options(joinedload(User.posts))\
    .filter(User.id == 1)\
    .first()

# Posts are already loaded - no additional query needed
print(user.posts)  # ✅ Data already available
```

- Javascript

```
// Eager Loading Example - JavaScript
class ImageGallery {
    constructor(imageUrls) {
        this.images = [];
        this.loadAllImages(imageUrls); // Load immediately
    }

    loadAllImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url; // Load all images upfront
            this.images.push(img);
        });
    }
}

// All images start loading immediately
const gallery = new ImageGallery(['img1.jpg', 'img2.jpg', 'img3.jpg']);
```
