package com.mysillydeams.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import com.mysillydeams.app.R
import com.mysillydeams.app.ui.components.*
import com.mysillydeams.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen() {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()
    
    var isLoading by remember { mutableStateOf(false) }
    var showToast by remember { mutableStateOf<String?>(null) }
    var logoAnimated by remember { mutableStateOf(false) }
    
    // Animation states
    val logoScale by animateFloatAsState(
        targetValue = if (logoAnimated) 1f else 0.8f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ), label = "logo_scale"
    )
    
    val logoRotation by animateFloatAsState(
        targetValue = if (logoAnimated) 0f else -10f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ), label = "logo_rotation"
    )
    
    val contentAlpha by animateFloatAsState(
        targetValue = if (logoAnimated) 1f else 0f,
        animationSpec = tween(
            durationMillis = 800,
            delayMillis = 300
        ), label = "content_alpha"
    )
    
    // Trigger animations
    LaunchedEffect(Unit) {
        delay(300)
        logoAnimated = true
    }
    
    // Handle Google Sign-In
    val handleGoogleSignIn = {
        isLoading = true
        // Simulate sign-in process
        // In real app, implement Google Sign-In here
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = if (isDark) {
                    Brush.radialGradient(
                        colors = listOf(
                            BrandPurple.copy(alpha = 0.1f),
                            BrandPink.copy(alpha = 0.1f),
                            Gray900
                        )
                    )
                } else {
                    Brush.radialGradient(
                        colors = listOf(
                            BrandIndigo.copy(alpha = 0.1f),
                            BrandPurple.copy(alpha = 0.1f),
                            Gray50
                        )
                    )
                }
            )
    ) {
        // Animated background elements
        AnimatedBackgroundElements(isDark = isDark)
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Main content card
            NeumorphicBox(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                cornerRadius = 24.dp,
                elevation = 16.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Theme toggle button
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        NeumorphicButton(
                            onClick = { /* Toggle theme */ },
                            modifier = Modifier.size(48.dp),
                            cornerRadius = 24.dp,
                            elevation = 8.dp
                        ) {
                            Icon(
                                imageVector = if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "Toggle theme",
                                modifier = Modifier.size(20.dp),
                                tint = if (isDark) WarningYellow else Gray600
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Logo and title
                    Row(
                        modifier = Modifier
                            .scale(logoScale)
                            .rotate(logoRotation),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Logo",
                            modifier = Modifier.size(32.dp),
                            tint = BrandPurple
                        )
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        Text(
                            text = "MySillyDreams",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            color = if (isDark) Gray100 else Gray900
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    // Welcome text with animation
                    AnimatedVisibility(
                        visible = logoAnimated,
                        enter = fadeIn() + slideInVertically(),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = stringResource(R.string.welcome_title),
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = if (isDark) Gray200 else Gray700,
                                textAlign = TextAlign.Center
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text(
                                text = stringResource(R.string.welcome_subtitle),
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (isDark) Gray400 else Gray600,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(48.dp))
                    
                    // Google Sign-In Button
                    AnimatedVisibility(
                        visible = logoAnimated,
                        enter = fadeIn() + slideInVertically(),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        GoogleSignInButton(
                            onClick = handleGoogleSignIn,
                            isLoading = isLoading,
                            isDark = isDark
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    // Terms and Privacy
                    AnimatedVisibility(
                        visible = logoAnimated,
                        enter = fadeIn() + slideInVertically()
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            NeumorphicButton(
                                onClick = { /* Open terms */ },
                                cornerRadius = 12.dp,
                                elevation = 4.dp
                            ) {
                                Text(
                                    text = "📋 ${stringResource(R.string.terms)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isDark) Gray300 else Gray600,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                )
                            }
                            
                            NeumorphicButton(
                                onClick = { /* Open privacy */ },
                                cornerRadius = 12.dp,
                                elevation = 4.dp
                            ) {
                                Text(
                                    text = "🔒 ${stringResource(R.string.privacy)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isDark) Gray300 else Gray600,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
        
        // Toast message
        showToast?.let { message ->
            ToastMessage(
                message = message,
                onDismiss = { showToast = null },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}

@Composable
fun GoogleSignInButton(
    onClick: () -> Unit,
    isLoading: Boolean,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    NeumorphicButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        cornerRadius = 16.dp,
        elevation = 12.dp,
        enabled = !isLoading
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = BrandPurple,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = stringResource(R.string.signing_in),
                    style = MaterialTheme.typography.titleSmall,
                    color = if (isDark) Gray300 else Gray700
                )
            } else {
                // Google logo (using emoji for simplicity)
                Text(
                    text = "🔍",
                    fontSize = 20.sp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = stringResource(R.string.continue_with_google),
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Medium
                    ),
                    color = if (isDark) Gray200 else Gray800
                )
            }
        }
    }
}

@Composable
fun AnimatedBackgroundElements(isDark: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "background")

    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(20000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ), label = "rotation"
    )

    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "scale"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        // Floating elements
        repeat(3) { index ->
            Box(
                modifier = Modifier
                    .offset(
                        x = (50 + index * 100).dp,
                        y = (100 + index * 150).dp
                    )
                    .size((40 + index * 20).dp)
                    .scale(scale)
                    .rotate(rotation + index * 120f)
                    .clip(RoundedCornerShape(50))
                    .background(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                BrandPurple.copy(alpha = 0.1f),
                                BrandPink.copy(alpha = 0.05f),
                                Color.Transparent
                            )
                        )
                    )
            )
        }
    }
}

@Composable
fun ToastMessage(
    message: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    LaunchedEffect(message) {
        delay(3000)
        onDismiss()
    }

    NeumorphicBox(
        modifier = modifier
            .padding(16.dp)
            .fillMaxWidth(),
        cornerRadius = 12.dp,
        elevation = 8.dp
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(16.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = if (isSystemInDarkTheme()) Gray200 else Gray800,
            textAlign = TextAlign.Center
        )
    }
}
