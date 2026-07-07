# Architecture Diagrams

This folder contains Wiki-ready PlantUML architecture diagrams for Local VTT.

Architecture baseline: Local VTT `0.1.15` release-prep branch. The package metadata may still report the previous release until release metadata is updated.

- [`plantuml.md`](plantuml.md): PlantUML diagrams using the C4-PlantUML standard library where C4 notation is useful, plus plain PlantUML activity diagrams for focused flows.

Recommended Wiki order:

1. System Context
2. Container Diagram
3. React/Electron MVC-Style Ownership
4. Renderer Component Diagram
5. Scene Canvas Pipeline
6. 3D Dice And Effect Rendering
7. Electron Main Components
8. Campaign Data And Persistence Flow
9. Player View Trust Boundary
10. Asset Import And Token Crop Flow
11. Asset Deletion Safety Flow
12. Smoke Verification Flow

PlantUML is the preferred diagram source because it gives stronger layout hints such as `Lay_R` and `Lay_D`, which keeps these architecture diagrams readable as the diagram set grows.
