# MEREC-AROMAN Web Application - User Documentation

## Overview
The MEREC-AROMAN Sustainability Assessment Tool is a web-based application designed to evaluate the sustainability performance of automotive manufacturing plants using advanced Multi-Criteria Decision Making (MCDM) methodologies.

## Features
- **Dynamic Input System**: Add any number of alternatives and criteria
- **MEREC Algorithm**: Calculates objective criteria weights based on removal effects
- **AROMAN Algorithm**: Ranks alternatives using two-step normalization
- **Interactive Interface**: User-friendly tabbed interface with real-time updates
- **Visualization**: Bar charts showing performance rankings
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### Step 1: Data Input
1. **Define Alternatives**: Enter the names of automotive manufacturing plants to be evaluated
2. **Define Criteria**: Enter sustainability criteria and specify their types:
   - **Benefit**: Higher values are better (e.g., Economic Performance, Social Responsibility)
   - **Cost**: Lower values are better (e.g., Environmental Impact, Waste Generation)
3. **Decision Matrix**: Enter performance values for each alternative-criterion pair
   - All values must be positive numbers
   - Values represent the performance of each alternative on each criterion

### Step 2: Calculation
1. Click on the "Calculation" tab
2. Review the methodology overview
3. Click "Calculate MEREC-AROMAN" to run the analysis
4. View the calculated criteria weights from the MEREC method

### Step 3: Results
1. Click on the "Results" tab to view:
   - Final ranking of alternatives
   - AROMAN scores for each alternative
   - Ki (Cost) and Oi (Benefit) values
   - Performance visualization chart

## Methodology

### MEREC (Method based on the Removal Effects of Criteria)
- Objective weighting method that determines criteria importance
- Based on the effect of removing each criterion from the decision matrix
- Provides unbiased weights without requiring expert judgment

### AROMAN (Alternative Ranking Order Method Accounting for Two-Step Normalization)
- Uses linear and vector normalization techniques
- Combines normalized values with calculated weights
- Produces final ranking scores for alternatives

## Example Data
The application comes pre-loaded with example data for Turkish automotive manufacturers:
- **Alternatives**: Ford Otosan, Toyota Turkey, Renault Turkey
- **Criteria**: Environmental Impact (Cost), Economic Performance (Benefit), Social Responsibility (Benefit)

## Technical Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection for initial loading

## Support
For technical support or questions about the methodology, please refer to the academic literature on MEREC and AROMAN methods or contact the development team.

