package com.mysillydeams.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.mysillydeams.app.ui.theme.*

@Composable
fun NeumorphicBox(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 16.dp,
    elevation: Dp = 8.dp,
    isPressed: Boolean = false,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val isDark = isSystemInDarkTheme()
    
    val backgroundColor = if (isDark) NeumorphicDark else NeumorphicLight
    val shadowColor = if (isDark) NeumorphicDarkShadow else NeumorphicLightShadow
    val highlightColor = if (isDark) NeumorphicDarkHighlight else NeumorphicLightHighlight
    
    Box(
        modifier = modifier
            .shadow(
                elevation = if (isPressed) elevation / 2 else elevation,
                shape = RoundedCornerShape(cornerRadius),
                ambientColor = shadowColor,
                spotColor = shadowColor
            )
            .clip(RoundedCornerShape(cornerRadius))
            .background(
                brush = if (isPressed) {
                    Brush.linearGradient(
                        colors = listOf(shadowColor, highlightColor)
                    )
                } else {
                    Brush.linearGradient(
                        colors = listOf(highlightColor, backgroundColor, shadowColor)
                    )
                }
            )
            .then(
                if (onClick != null) {
                    Modifier.clickable { onClick() }
                } else {
                    Modifier
                }
            ),
        content = content
    )
}

@Composable
fun NeumorphicButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    cornerRadius: Dp = 16.dp,
    elevation: Dp = 8.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val isDark = isSystemInDarkTheme()
    
    NeumorphicBox(
        modifier = modifier.clickable(enabled = enabled) { if (enabled) onClick() },
        cornerRadius = cornerRadius,
        elevation = elevation,
        content = content
    )
}

@Composable
fun GradientBackground(
    modifier: Modifier = Modifier,
    isDark: Boolean = isSystemInDarkTheme()
) {
    Box(
        modifier = modifier.background(
            brush = if (isDark) {
                Brush.radialGradient(
                    colors = listOf(
                        BrandPurple.copy(alpha = 0.1f),
                        BrandPink.copy(alpha = 0.1f),
                        BrandIndigo.copy(alpha = 0.1f),
                        Gray900
                    )
                )
            } else {
                Brush.radialGradient(
                    colors = listOf(
                        BrandIndigo.copy(alpha = 0.1f),
                        BrandPurple.copy(alpha = 0.1f),
                        BrandPink.copy(alpha = 0.1f),
                        Gray50
                    )
                )
            }
        )
    )
}

@Composable
fun AnimatedGradientText(
    text: String,
    modifier: Modifier = Modifier,
    isDark: Boolean = isSystemInDarkTheme()
) {
    androidx.compose.material3.Text(
        text = text,
        modifier = modifier,
        style = MaterialTheme.typography.titleLarge,
        color = if (isDark) {
            Color.Transparent
        } else {
            Color.Transparent
        }
    )
}
