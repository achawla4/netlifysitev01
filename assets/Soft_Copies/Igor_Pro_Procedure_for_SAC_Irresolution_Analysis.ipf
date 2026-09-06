#pragma TextEncoding = "UTF-8"
#pragma rtGlobals=3		// Use modern global access method and strict wave access.

// Starburst Amacrine Cell Irresolution Analysis
// Based on "Information Theory and Direction Selectivity" by Aman Chawla
// Implements the irresolution computation for tuning curves

Menu "SAC Analysis"
	"Open SAC Irresolution Panel", OpenSACPanel()
End

// Main panel creation function
Function OpenSACPanel()
	DoWindow/K SACIrresolutionPanel
	NewPanel/W=(100,100,600,520)/N=SACIrresolutionPanel as "SAC Irresolution Analysis"
	
	// Title
	TitleBox title, pos={20,10}, size={400,20}, title="Starburst Amacrine Cell Irresolution Analysis"
	TitleBox title, fStyle=1, fSize=14
	
	// Input section
	GroupBox inputGroup, pos={20,40}, size={460,120}, title="Input Parameters"
	
	// Rate parameter
	SetVariable rateVar, pos={40,65}, size={120,16}, title="Rate R (bits/s):"
	SetVariable rateVar, value=_NUM:10, limits={0.1,1000,1}
	
	// Duration parameter  
	SetVariable durationVar, pos={40,90}, size={120,16}, title="Duration l (s):"
	SetVariable durationVar, value=_NUM:2, limits={0.1,100,0.1}
	
	// Noise level (optional)
	SetVariable noiseVar, pos={200,65}, size={120,16}, title="Noise σ:"
	SetVariable noiseVar, value=_NUM:0.1, limits={0,10,0.01}
	
	// Manual k input
	SetVariable kVar, pos={200,90}, size={120,16}, title="Manual k:"
	SetVariable kVar, value=_NUM:3, limits={1,100,1}
	
	// Auto-detection toggle
	CheckBox autoDetectCheck, pos={40,115}, size={150,16}, title="Auto-detect critical points"
	CheckBox autoDetectCheck, value=1, proc=AutoDetectCheckProc
	
	// Tuning curve section
	GroupBox curveGroup, pos={20,170}, size={460,120}, title="Tuning Curve Data"
	
	Button loadDataBtn, pos={40,195}, size={100,20}, title="Load Data", proc=LoadTuningCurveProc
	PopupMenu examplePopup, pos={150,195}, size={120,20}, title="Example:", proc=ExamplePopupProc
	PopupMenu examplePopup, mode=1, value="Unimodal;Bimodal;Trimodal;Multi-peak;Noisy Gaussian;Sinusoidal;Complex;Asymmetric;Broad Tuning;Sharp Tuning"
	Button generateBtn, pos={280,195}, size={100,20}, title="Generate", proc=GenerateExampleProc
	
	PopupMenu curvePopup, pos={40,250}, size={150,20}, title="Select Wave:"
	PopupMenu curvePopup, mode=1, value=WaveList("*",";","")
	
	SetVariable angleStartVar, pos={200,250}, size={100,16}, title="Angle Start:"
	SetVariable angleStartVar, value=_NUM:0, limits={-180,180,1}
	
	SetVariable angleEndVar, pos={310,250}, size={100,16}, title="Angle End:"
	SetVariable angleEndVar, value=_NUM:360, limits={-180,720,1}
	
	Button plotCurveBtn, pos={40,275}, size={100,20}, title="Plot Curve", proc=PlotTuningCurveProc
	
	// Analysis section
	GroupBox analysisGroup, pos={20,310}, size={460,120}, title="Analysis"
	
	Button runAnalysisBtn, pos={40,335}, size={150,25}, title="Run Irresolution Analysis", proc=RunIrresolutionAnalysisProc
	Button runAnalysisBtn, fColor=(0,32768,0)
	
	Button plotVsDurationBtn, pos={200,335}, size={120,20}, title="Plot vs Duration", proc=PlotVsDurationProc
	Button plotVsRateBtn, pos={330,335}, size={100,20}, title="Plot vs Rate", proc=PlotVsRateProc
	
	// Results display
	SetVariable resultsVar, pos={40,365}, size={200,16}, title="Detected k value:"
	SetVariable resultsVar, value=_STR:"", noedit=1
	
	SetVariable irresolutionVar, pos={40,390}, size={200,16}, title="Irresolution range:"
	SetVariable irresolutionVar, value=_STR:"", noedit=1
	
	Button exportBtn, pos={350,365}, size={80,20}, title="Export Data", proc=ExportResultsProc
	Button helpBtn, pos={350,390}, size={80,20}, title="Help", proc=ShowHelpProc
End

// Auto-detection checkbox procedure
Function AutoDetectCheckProc(cba) : CheckBoxControl
	STRUCT WMCheckboxAction &cba
	
	switch(cba.eventCode)
		case 2: // mouse up
			ControlInfo/W=SACIrresolutionPanel autoDetectCheck
			SetVariable kVar, win=SACIrresolutionPanel, disable=(V_Value ? 2 : 0)
			break
	endswitch
	return 0
End

// Load tuning curve data procedure
Function LoadTuningCurveProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			LoadWave/J/D/A/K=0
			PopupMenu curvePopup, win=SACIrresolutionPanel, value=WaveList("*",";","")
			break
	endswitch
	return 0
End

// Generate example tuning curve
// Generate example tuning curve
Function GenerateExampleProc(ba) : ButtonControl
    STRUCT WMButtonAction &ba
    
    switch(ba.eventCode)
        case 2: // mouse up
            // Get the selected example type from the examplePopup menu
            ControlInfo/W=SACIrresolutionPanel examplePopup
            if(V_Value < 1 || V_Value > 10)
                DoAlert 0, "Please select a valid example type"
                return -1
            endif
            Variable exampleType = V_Value
            
            // Generate the tuning curve with the selected example type
            GenerateExampleTuningCurve(exampleType)
            
            // Update the curve popup menu with available waves
            PopupMenu curvePopup, win=SACIrresolutionPanel, value=WaveList("*",";","")
            break
    endswitch
    return 0
End
// Plot tuning curve procedure
Function PlotTuningCurveProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			PlotSelectedTuningCurve()
			break
	endswitch
	return 0
End

// Main irresolution analysis procedure
Function RunIrresolutionAnalysisProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			RunIrresolutionAnalysis()
			break
	endswitch
	return 0
End

// Plot irresolution vs duration
Function PlotVsDurationProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			PlotIrresolutionVsDuration()
			break
	endswitch
	return 0
End

// Plot irresolution vs rate
Function PlotVsRateProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			PlotIrresolutionVsRate()
			break
	endswitch
	return 0
End

// Export results procedure
Function ExportResultsProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			ExportAnalysisResults()
			break
	endswitch
	return 0
End

// Show help procedure
Function ShowHelpProc(ba) : ButtonControl
	STRUCT WMButtonAction &ba
	
	switch(ba.eventCode)
		case 2: // mouse up
			ShowSACHelp()
			break
	endswitch
	return 0
End

// Generate example tuning curves with 10 different types
Function GenerateExampleTuningCurve(exampleType)
    Variable exampleType // 1-10 for different curve types
    
    // Validate input
    if(exampleType < 1 || exampleType > 10)
        Abort "Invalid exampleType: must be 1-10"
    endif
    
    Variable numPoints = 360
    Make/O/N=(numPoints) exampleAngles, exampleResponse
    if(!WaveExists(exampleAngles) || !WaveExists(exampleResponse))
        Abort "Failed to create example waves"
    endif
    exampleAngles = p
    
    String curveName, description
    Variable sigma
    
    switch(exampleType)
        case 1: // Unimodal - Single Gaussian-like peak
            curveName = "Unimodal_SAC"
            description = "Single directional preference (DS cell)"
            sigma = 30
            exampleResponse = exp(-((exampleAngles-90)^2)/(2*sigma^2))
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        case 2: // Bimodal - Two peaks 180 degrees apart
            curveName = "Bimodal_SAC"
            description = "Two opposite directional preferences"
            sigma = 25
            exampleResponse = exp(-((exampleAngles-90)^2)/(2*sigma^2))
            exampleResponse += 0.7 * exp(-((exampleAngles-270)^2)/(2*sigma^2))
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        case 3: // Trimodal - Three peaks 120 degrees apart
            curveName = "Trimodal_SAC"
            description = "Three-way directional selectivity"
            sigma = 20
            exampleResponse = exp(-((exampleAngles-60)^2)/(2*sigma^2))
            exampleResponse += exp(-((exampleAngles-180)^2)/(2*sigma^2))
            exampleResponse += exp(-((exampleAngles-300)^2)/(2*sigma^2))
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        case 4: // Multi-peak - Complex response with many peaks
            curveName = "Multipeak_SAC"
            description = "Complex multi-directional response"
            exampleResponse = exp(cos((exampleAngles-90)*pi/180))
            exampleResponse += 0.5 * exp(cos((exampleAngles-270)*pi/180))
            exampleResponse += 0.3 * sin(2*exampleAngles*pi/180)
            exampleResponse += 0.2 * cos(3*exampleAngles*pi/180)
            exampleResponse += 0.1 * gnoise(0.1)
            break
            
        case 5: // Noisy Gaussian - Single peak with high noise
            curveName = "NoisyGaussian_SAC"
            description = "Single peak with high noise levels"
            sigma = 40
            exampleResponse = 2 * exp(-((exampleAngles-135)^2)/(2*sigma^2))
            exampleResponse += 0.3 * gnoise(0.2)
            break
            
        case 6: // Sinusoidal - Pure sinusoidal response
            curveName = "Sinusoidal_SAC"
            description = "Simple sinusoidal directional tuning"
            exampleResponse = 1 + 0.8 * sin(2*(exampleAngles-45)*pi/180)
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        case 7: // Complex - Multiple harmonics
            curveName = "Complex_SAC"
            description = "Multi-harmonic complex tuning"
            exampleResponse = 1.5 + sin((exampleAngles-30)*pi/180)
            exampleResponse += 0.5 * sin(2*(exampleAngles-30)*pi/180)
            exampleResponse += 0.3 * sin(3*(exampleAngles-30)*pi/180)
            exampleResponse += 0.2 * cos(4*exampleAngles*pi/180)
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        case 8: // Asymmetric - Skewed response
            curveName = "Asymmetric_SAC"
            description = "Asymmetric directional preference"
            sigma = 40
            exampleResponse = exp(-((exampleAngles-120)^2)/(2*sigma^2)) * (1 + 0.5*sin((exampleAngles-120)*pi/90))
            exampleResponse += 0.3 * exp(-((exampleAngles-300)^2)/(2*20^2))
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        case 9: // Broad Tuning - Wide, shallow response
            curveName = "BroadTuning_SAC"
            description = "Broadly tuned directional response"
            sigma = 80
            exampleResponse = 0.8 + 0.6 * exp(-((exampleAngles-180)^2)/(2*sigma^2))
            exampleResponse += 0.2 * cos(2*exampleAngles*pi/180)
            exampleResponse += 0.1 * gnoise(0.1)
            break
            
        case 10: // Sharp Tuning - Very narrow, sharp peaks
            curveName = "SharpTuning_SAC"
            description = "Sharply tuned directional selectivity"
            exampleResponse = 2 * exp(-((exampleAngles-45)^2)/(2*8^2))
            exampleResponse += 1.5 * exp(-((exampleAngles-225)^2)/(2*8^2))
            exampleResponse += 0.3 * exp(-((exampleAngles-135)^2)/(2*12^2))
            exampleResponse += 0.05 * gnoise(0.1)
            break
            
        default:
            curveName = "Default_SAC"
            description = "Default multi-modal response"
            exampleResponse = exp(cos((exampleAngles-90)*pi/180))
            exampleResponse += 0.5 * exp(cos((exampleAngles-270)*pi/180))
            exampleResponse += 0.3 * sin(2*exampleAngles*pi/180)
            exampleResponse += 0.1 * gnoise(0.1)
            break
    endswitch
    
    // Ensure positive response
    Variable minVal = WaveMin(exampleResponse)
    if(minVal < 0)
        exampleResponse += abs(minVal) + 0.1
    endif
    
    // Rename waves with descriptive names
    Duplicate/O exampleResponse, $curveName
    Duplicate/O exampleAngles, $(curveName + "_angles")
    
    print "Generated", curveName + ":", description
    print "  Number of points:", numPoints
    print "  Response range:", WaveMin($curveName), "to", WaveMax($curveName)
    
    // Update the wave popup to reflect new wave
    PopupMenu curvePopup, win=SACIrresolutionPanel, value=WaveList("*",";","")
End

// Plot the selected tuning curve
Function PlotSelectedTuningCurve()
    ControlInfo/W=SACIrresolutionPanel curvePopup
    String selectedWave = S_Value
    
    if(strlen(selectedWave) == 0 || !WaveExists($selectedWave))
        DoAlert 0, "Please select a valid wave"
        return -1
    endif
    
    Wave responseWave = $selectedWave
    Variable numPoints = numpnts(responseWave)
    
    ControlInfo/W=SACIrresolutionPanel angleStartVar
    Variable angleStart = V_Value
    ControlInfo/W=SACIrresolutionPanel angleEndVar  
    Variable angleEnd = V_Value
    
    Make/O/N=(numPoints) angleAxis
    angleAxis = angleStart + p * (angleEnd - angleStart) / (numPoints - 1)
    
    DoWindow/K TuningCurveGraph
    Display/N=TuningCurveGraph responseWave vs angleAxis
    ModifyGraph mode=4, marker=8, msize=2
    Label left "Response Amplitude"
    Label bottom "Direction (degrees)"
    SetAxis bottom angleStart, angleEnd
    
    // Remove critical point marking to eliminate spikes
    // Wave criticalPoints = FindCriticalPoints(responseWave)
    // if(WaveExists(criticalPoints))
    //     Variable i
    //     for(i = 0; i < numpnts(criticalPoints); i += 1)
    //         Variable critIndex = criticalPoints[i]
    //         if(critIndex >= 0 && critIndex < numPoints)
    //             SetDrawEnv xcoord=bottom, ycoord=left, linefgc=(65535,0,0)
    //             DrawLine angleAxis[critIndex], responseWave[critIndex]-0.1, angleAxis[critIndex], responseWave[critIndex]+0.1
    //         endif
    //     endfor
    // endif
    
    print "Plotted tuning curve without critical points marked"
End
// Find critical points (maxima and minima)
Function/WAVE FindCriticalPoints(responseWave)
	Wave responseWave
	Variable numPoints = numpnts(responseWave)
	
	if(numPoints < 3)
		return $""
	endif
	
	// Calculate numerical derivative
	Make/O/N=(numPoints-2) derivative
	Variable i
	for(i = 1; i < numPoints-1; i += 1)
		derivative[i-1] = (responseWave[i+1] - responseWave[i-1]) / 2
	endfor
	
	// Find zero crossings (critical points)
	Make/O/N=0 criticalIndices
	for(i = 0; i < numPoints-3; i += 1)
		if(derivative[i] * derivative[i+1] < 0) // Sign change
			InsertPoints inf, 1, criticalIndices
			criticalIndices[numpnts(criticalIndices)-1] = i + 1 // Adjust for derivative indexing
		endif
	endfor
	
	return criticalIndices
End

// Action procedure for examplePopup menu
Function ExamplePopupProc(pa) : PopupMenuControl
    STRUCT WMPopupAction &pa
    
    switch(pa.eventCode)
        case 2: // mouse up
            Variable popNum = pa.popNum
            String popStr = pa.popStr
            print "Selected example:", popStr, " (index:", popNum, ")"
            break
    endswitch
    return 0
End

// Main irresolution analysis function
Function RunIrresolutionAnalysis()
	// Get parameters from panel
	ControlInfo/W=SACIrresolutionPanel rateVar
	Variable rate = V_Value
	ControlInfo/W=SACIrresolutionPanel durationVar
	Variable duration = V_Value
	ControlInfo/W=SACIrresolutionPanel curvePopup
	String selectedWave = S_Value
	
	if(strlen(selectedWave) == 0 || !WaveExists($selectedWave))
		DoAlert 0, "Please select a valid tuning curve wave"
		return -1
	endif
	
	Wave responseWave = $selectedWave
	Variable k
	
	// Determine k value
	ControlInfo/W=SACIrresolutionPanel autoDetectCheck
	if(V_Value) // Auto-detect
		Wave criticalPoints = FindCriticalPoints(responseWave)
		if(WaveExists(criticalPoints))
			Variable n = numpnts(criticalPoints)
			k = 2 * n - 1
			if(k < 1)
				k = 1
			endif
		else
			k = 1
		endif
	else // Manual k
		ControlInfo/W=SACIrresolutionPanel kVar
		k = V_Value
	endif
	
	// Calculate irresolution bounds
	Variable cMin = 1
	Variable cMax = 1 + log(k)/log(2) / (duration * rate)
	
	// Update results display
	SetVariable resultsVar, win=SACIrresolutionPanel, value=_STR:num2str(k)
	String irresolutionStr = num2str(cMin, "%.3f") + " ≤ c ≤ " + num2str(cMax, "%.3f")
	SetVariable irresolutionVar, win=SACIrresolutionPanel, value=_STR:irresolutionStr
	
	// Store results in global variables for plotting
	Variable/G gSAC_k = k
	Variable/G gSAC_cMin = cMin
	Variable/G gSAC_cMax = cMax
	Variable/G gSAC_rate = rate
	Variable/G gSAC_duration = duration
	
	print "Analysis complete:"
	print "  Detected k =", k
	print "  Irresolution range:", cMin, "≤ c ≤", cMax
End

// Plot irresolution vs duration (Figure 6 style)
Function PlotIrresolutionVsDuration()
	NVAR gSAC_k, gSAC_rate
	
	if(!NVAR_Exists(gSAC_k) || !NVAR_Exists(gSAC_rate))
		DoAlert 0, "Please run the analysis first"
		return -1
	endif
	
	// Create duration range
	Variable numPoints = 100
	Make/O/N=(numPoints) durationRange, irresolutionMin, irresolutionMax
	
	durationRange = 0.1 + p * 9.9 / (numPoints - 1) // 0.1 to 10 seconds
	irresolutionMin = 1
	irresolutionMax = 1 + log(gSAC_k)/log(2) / (durationRange * gSAC_rate)
	
	// Create plots for multiple k values
	Variable i, kValue
	DoWindow/K IrresolutionVsDuration
	Display/N=IrresolutionVsDuration irresolutionMin vs durationRange
	AppendToGraph irresolutionMax vs durationRange
	
	// Add curves for different k values (k = 2, 5, 8, 11, 14, 17, 20)
	for(i = 0; i < 7; i += 1)
		kValue = 2 + i * 3
		String waveName = "irres_k" + num2str(kValue)
		Make/O/N=(numPoints) $waveName
		Wave tempWave = $waveName
		tempWave = 1 + log(kValue)/log(2) / (durationRange * gSAC_rate)
		AppendToGraph tempWave vs durationRange
		ModifyGraph rgb($waveName)=(16384 + i*8192, 32768 - i*4096, 65535 - i*6000)
	endfor
	
	Label left "Irresolution c"
	Label bottom "Duration l (seconds)"
	Legend/C/N=text0/F=0/A=RT "\\s(irresolutionMin) c_min\r\\s(irresolutionMax) k=" + num2str(gSAC_k)
	
	for(i = 0; i < 7; i += 1)
		kValue = 2 + i * 3
		AppendText "\\s(irres_k" + num2str(kValue) + ") k=" + num2str(kValue)
	endfor
	
	print "Generated irresolution vs duration plot (Figure 6 style)"
End

// Plot irresolution vs rate (Figure 7 style)
Function PlotIrresolutionVsRate()
	NVAR gSAC_k, gSAC_duration
	
	if(!NVAR_Exists(gSAC_k) || !NVAR_Exists(gSAC_duration))
		DoAlert 0, "Please run the analysis first"
		return -1
	endif
	
	// Create rate range
	Variable numPoints = 100
	Make/O/N=(numPoints) rateRange, irresolutionMinRate, irresolutionMaxRate
	
	rateRange = 0.5 + p * 49.5 / (numPoints - 1) // 0.5 to 50 bits/s
	irresolutionMinRate = 1
	irresolutionMaxRate = 1 + log(gSAC_k)/log(2) / (gSAC_duration * rateRange)
	
	// Create plots for multiple k values
	Variable i, kValue
	DoWindow/K IrresolutionVsRate
	Display/N=IrresolutionVsRate irresolutionMinRate vs rateRange
	AppendToGraph irresolutionMaxRate vs rateRange
	
	// Add curves for different k values (k = 2, 5, 8, 11, 14, 17, 20)
	for(i = 0; i < 7; i += 1)
		kValue = 2 + i * 3
		String waveName = "irres_rate_k" + num2str(kValue)
		Make/O/N=(numPoints) $waveName
		Wave tempWave = $waveName
		tempWave = 1 + log(kValue)/log(2) / (gSAC_duration * rateRange)
		AppendToGraph tempWave vs rateRange
		ModifyGraph rgb($waveName)=(16384 + i*8192, 32768 - i*4096, 65535 - i*6000)
	endfor
	
	Label left "Irresolution c"
	Label bottom "Rate R (bits/second)"
	Legend/C/N=text0/F=0/A=RT "\\s(irresolutionMinRate) c_min\r\\s(irresolutionMaxRate) k=" + num2str(gSAC_k)
	
	for(i = 0; i < 7; i += 1)
		kValue = 2 + i * 3
		AppendText "\\s(irres_rate_k" + num2str(kValue) + ") k=" + num2str(kValue)
	endfor
	
	print "Generated irresolution vs rate plot (Figure 7 style)"
End

// Export analysis results
Function ExportAnalysisResults()
	NVAR gSAC_k, gSAC_cMin, gSAC_cMax, gSAC_rate, gSAC_duration
	
	if(!NVAR_Exists(gSAC_k))
		DoAlert 0, "Please run the analysis first"
		return -1
	endif
	
	String fileName
	Prompt fileName, "Enter filename for export:"
	DoPrompt "Export Results", fileName
	
	if(V_flag)
		return -1
	endif
	
	// Create results table
	Make/O/T/N=6 exportLabels, exportValues
	exportLabels[0] = "Parameter"
	exportLabels[1] = "k (directional ambiguity)"
	exportLabels[2] = "Rate R (bits/s)"
	exportLabels[3] = "Duration l (s)"
	exportLabels[4] = "Irresolution min c"
	exportLabels[5] = "Irresolution max c"
	
	exportValues[0] = "Value"
	exportValues[1] = num2str(gSAC_k)
	exportValues[2] = num2str(gSAC_rate)
	exportValues[3] = num2str(gSAC_duration)
	exportValues[4] = num2str(gSAC_cMin, "%.6f")
	exportValues[5] = num2str(gSAC_cMax, "%.6f")
	
	Edit/N=SACResults exportLabels, exportValues
	
	print "Results exported to table SACResults"
End

// Show help information
Function ShowSACHelp()
	DoWindow/K SACHelpNotebook
	NewNotebook/N=SACHelpNotebook/F=1 as "SAC Irresolution Analysis Help"
	
	Notebook SACHelpNotebook, text="SAC IRRESOLUTION ANALYSIS HELP\r\r"
	Notebook SACHelpNotebook, text="This tool implements the irresolution analysis from:\r"
	Notebook SACHelpNotebook, text="\"Information Theory and Direction Selectivity\" by Aman Chawla\r\r"
	
	Notebook SACHelpNotebook, text="THEORY:\r"
	Notebook SACHelpNotebook, text="The irresolution c quantifies the efficiency of a starburst amacrine cell\r"
	Notebook SACHelpNotebook, text="in encoding directional information. It is bounded by:\r\r"
	Notebook SACHelpNotebook, text="1 ≤ c ≤ 1 + log₂(k)/(l×R)\r\r"
	
	Notebook SACHelpNotebook, text="Where:\r"
	Notebook SACHelpNotebook, text="• k = directional ambiguity (2n-1, where n = critical points)\r"
	Notebook SACHelpNotebook, text="• l = transmission duration (seconds)\r" 
	Notebook SACHelpNotebook, text="• R = transmission rate (bits/second)\r\r"
	
	Notebook SACHelpNotebook, text="BUILT-IN EXAMPLES:\r"
	Notebook SACHelpNotebook, text="The tool provides 10 different example tuning curves:\r"
	Notebook SACHelpNotebook, text="1. Unimodal - Single directional preference\r"
	Notebook SACHelpNotebook, text="2. Bimodal - Two opposite preferences (180° apart)\r"
	Notebook SACHelpNotebook, text="3. Trimodal - Three-way selectivity (120° apart)\r"
	Notebook SACHelpNotebook, text="4. Multi-peak - Complex response with many peaks\r"
	Notebook SACHelpNotebook, text="5. Noisy Gaussian - Single peak with high noise\r"
	Notebook SACHelpNotebook, text="6. Sinusoidal - Pure sinusoidal tuning\r"
	Notebook SACHelpNotebook, text="7. Complex - Multi-harmonic response\r"
	Notebook SACHelpNotebook, text="8. Asymmetric - Skewed directional preference\r"
	Notebook SACHelpNotebook, text="9. Broad Tuning - Wide, shallow response\r"
	Notebook SACHelpNotebook, text="10. Sharp Tuning - Narrow, sharp peaks\r\r"
	
	Notebook SACHelpNotebook, text="USAGE:\r"
	Notebook SACHelpNotebook, text="1. Select an example from the dropdown or load your own data\r"
	Notebook SACHelpNotebook, text="2. Generate the selected example tuning curve\r"
	Notebook SACHelpNotebook, text="3. Set parameters (R, l) or use auto-detection for k\r"
	Notebook SACHelpNotebook, text="4. Run analysis to compute irresolution bounds\r"
	Notebook SACHelpNotebook, text="5. Generate plots showing irresolution vs duration/rate\r\r"
	
	Notebook SACHelpNotebook, text="AUTO-DETECTION:\r"
	Notebook SACHelpNotebook, text="The tool automatically finds critical points (peaks/troughs) in\r"
	Notebook SACHelpNotebook, text="the tuning curve using numerical differentiation.\r"
	
	print "Help window opened"
End

// Initialize globals when loading
Function InitializeSACGlobals()
	Variable/G gSAC_k = 3
	Variable/G gSAC_cMin = 1
	Variable/G gSAC_cMax = 1.5
	Variable/G gSAC_rate = 10
	Variable/G gSAC_duration = 2
	Variable/G gSelectedExample = 1  // Default to first example
End

// Cleanup function
Function CleanupSACAnalysis()
	DoWindow/K SACIrresolutionPanel
	DoWindow/K TuningCurveGraph
	DoWindow/K IrresolutionVsDuration
	DoWindow/K IrresolutionVsRate
	DoWindow/K SACResults
	DoWindow/K SACHelpNotebook
	
	// Kill global variables
	KillVariables/Z gSAC_k, gSAC_cMin, gSAC_cMax, gSAC_rate, gSAC_duration, gSelectedExample
	
	print "SAC Analysis cleanup complete"
End

// Auto-execute when file is loaded
static Function InitOnLoad()
	InitializeSACGlobals()
End