# Architecture Diagrams

This folder contains Wiki-ready PlantUML architecture diagrams for Local VTT.

Architecture baseline: Local VTT `0.1.12`.

- [`plantuml.md`](plantuml.md): PlantUML diagrams using the C4-PlantUML standard library where C4 notation is useful, plus plain PlantUML activity diagrams for focused flows.

Recommended Wiki order:

1. System Context
2. Container Diagram
3. Renderer Component Diagram
4. Three.js And Rapier3D Usage
5. Electron Component Diagram
6. Campaign Data Flow
7. Player View Projection Flow
8. Player View Trust Boundary
9. Campaign Folder Persistence
10. Scene Rendering Pipeline
11. Asset Import Flow
12. Dice Roll Flow
13. Save And Dirty State Flow

PlantUML is the preferred diagram source because it gives stronger layout hints such as `Lay_R` and `Lay_D`, which keeps these architecture diagrams readable as the diagram set grows.
