# Notebook Google Colab — SVM Clasificación Financiera (Linear vs RBF)

Cada bloque `# CELDA N` corresponde a una celda independiente de Colab. Copia cada bloque de código en una celda nueva, en orden.

---

## CELDA 1 — Instalación / Importación de librerías

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, ConfusionMatrixDisplay
)

import joblib

sns.set_style("whitegrid")
pd.set_option("display.max_columns", None)
```

---

## CELDA 2 — Carga del dataset desde Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')

# Ajusta esta ruta a la carpeta donde guardaste el CSV dentro de tu Drive.
# Ejemplo: si está en "Mi unidad/TesisBBV/financial_health_dataset.csv",
# la ruta dentro de Colab es "/content/drive/MyDrive/TesisBBV/financial_health_dataset.csv"
DATASET_PATH = "/content/drive/MyDrive/UNIFRANZ/BBV-INVERSIONES/dataset/financial_health_dataset.csv"

df = pd.read_csv(DATASET_PATH)
print("Forma del dataset:", df.shape)
df.head()
```

---

## CELDA 3 — Inspección general

```python
print("Tipos de datos:")
print(df.dtypes)
print()
print("Valores nulos por columna:")
print(df.isnull().sum())
print()
print("Estadística descriptiva (variables numéricas):")
df.describe()
```

---

## CELDA 4 — Análisis exploratorio: distribución de clases

```python
plt.figure(figsize=(7, 4))
orden_clases = ["Excelente", "Saludable", "Observación", "Riesgo"]
sns.countplot(data=df, x="clasificacion_financiera", order=orden_clases, palette="viridis")
plt.title("Distribución de clases — clasificacion_financiera")
plt.xlabel("Clase")
plt.ylabel("Cantidad de registros")
for i, clase in enumerate(orden_clases):
    n = (df["clasificacion_financiera"] == clase).sum()
    plt.text(i, n + 5, str(n), ha="center", fontweight="bold")
plt.show()

print(df["clasificacion_financiera"].value_counts(normalize=True).round(3) * 100)
```

---

## CELDA 5 — Análisis exploratorio: distribución por sector

```python
plt.figure(figsize=(10, 5))
df["sector"].value_counts().plot(kind="barh", color="steelblue")
plt.title("Cantidad de registros por sector")
plt.xlabel("Cantidad de registros")
plt.tight_layout()
plt.show()
```

---

## CELDA 6 — Análisis exploratorio: correlación entre variables numéricas

```python
features_numericas = [
    "liquidez_corriente", "endeudamiento", "solvencia",
    "endeudamiento_patrimonial", "crecimiento_patrimonial", "crecimiento_activos",
]

plt.figure(figsize=(8, 6))
sns.heatmap(df[features_numericas].corr(), annot=True, fmt=".2f", cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Matriz de correlación — variables financieras")
plt.show()
```

---

## CELDA 7 — Análisis exploratorio: distribución de cada variable por clase

```python
fig, axes = plt.subplots(2, 3, figsize=(16, 9))
for ax, col in zip(axes.flatten(), features_numericas):
    sns.boxplot(data=df, x="clasificacion_financiera", y=col, order=orden_clases, ax=ax, palette="Set2")
    ax.set_title(col)
    ax.set_xlabel("")
plt.tight_layout()
plt.show()
```

---

## CELDA 8 — Selección de variables (features) y variable objetivo

```python
# IMPORTANTE: 'score_financiero' se EXCLUYE deliberadamente de las features.
# score_financiero = 35% liquidez + 35% endeudamiento + 20% crecimiento_patrimonial + 10% solvencia
# clasificacion_financiera = umbral fijo aplicado sobre score_financiero.
# Si se incluyera score_financiero como feature, el modelo solo aprendería a
# invertir una función determinística ya conocida (fuga de información /
# "target leakage"), no a clasificar a partir de los ratios financieros reales.
#
# 'empresa', 'sector', 'gestion' y 'trimestre' tampoco se usan como features
# numéricas en este experimento: el objetivo es que el SVM aprenda el patrón
# financiero (los 6 ratios), no que memorice la identidad de la empresa o el periodo.

FEATURES = [
    "liquidez_corriente",
    "endeudamiento",
    "solvencia",
    "endeudamiento_patrimonial",
    "crecimiento_patrimonial",
    "crecimiento_activos",
]
TARGET = "clasificacion_financiera"

X = df[FEATURES].copy()
y = df[TARGET].copy()

print("Features utilizadas:", FEATURES)
print("Forma de X:", X.shape)
print("Distribución de y:\n", y.value_counts())
```

---

## CELDA 9 — Split estratificado train/test

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y,  # mantiene la misma proporción de clases en train y test
)

print("Train:", X_train.shape, " Test:", X_test.shape)
print("\nDistribución de clases en train (%):")
print((y_train.value_counts(normalize=True) * 100).round(1))
print("\nDistribución de clases en test (%):")
print((y_test.value_counts(normalize=True) * 100).round(1))
```

---

## CELDA 10 — Escalado de variables (StandardScaler)

```python
# El scaler se ajusta SOLO con el set de entrenamiento, para evitar fuga
# de información del conjunto de prueba hacia el preprocesamiento.
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Media por feature en train (debe ser ~0):", X_train_scaled.mean(axis=0).round(3))
print("Desv. estándar por feature en train (debe ser ~1):", X_train_scaled.std(axis=0).round(3))
```

---

## CELDA 11 — Entrenamiento SVM Linear

```python
svm_linear = SVC(kernel="linear", class_weight="balanced", random_state=42)
svm_linear.fit(X_train_scaled, y_train)

y_pred_linear = svm_linear.predict(X_test_scaled)
print("SVM Linear entrenado.")
```

---

## CELDA 12 — Entrenamiento SVM RBF

```python
svm_rbf = SVC(kernel="rbf", class_weight="balanced", random_state=42)
svm_rbf.fit(X_train_scaled, y_train)

y_pred_rbf = svm_rbf.predict(X_test_scaled)
print("SVM RBF entrenado.")
```

---

## CELDA 13 — Métricas: SVM Linear

```python
print("=" * 60)
print("SVM LINEAR — Métricas en el conjunto de prueba")
print("=" * 60)
print(classification_report(y_test, y_pred_linear, target_names=orden_clases, zero_division=0))

acc_linear = accuracy_score(y_test, y_pred_linear)
prec_linear = precision_score(y_test, y_pred_linear, average="macro", zero_division=0)
rec_linear = recall_score(y_test, y_pred_linear, average="macro", zero_division=0)
f1_linear = f1_score(y_test, y_pred_linear, average="macro", zero_division=0)

print(f"Accuracy : {acc_linear:.4f}")
print(f"Precision (macro): {prec_linear:.4f}")
print(f"Recall (macro)   : {rec_linear:.4f}")
print(f"F1-score (macro) : {f1_linear:.4f}")
```

---

## CELDA 14 — Métricas: SVM RBF

```python
print("=" * 60)
print("SVM RBF — Métricas en el conjunto de prueba")
print("=" * 60)
print(classification_report(y_test, y_pred_rbf, target_names=orden_clases, zero_division=0))

acc_rbf = accuracy_score(y_test, y_pred_rbf)
prec_rbf = precision_score(y_test, y_pred_rbf, average="macro", zero_division=0)
rec_rbf = recall_score(y_test, y_pred_rbf, average="macro", zero_division=0)
f1_rbf = f1_score(y_test, y_pred_rbf, average="macro", zero_division=0)

print(f"Accuracy : {acc_rbf:.4f}")
print(f"Precision (macro): {prec_rbf:.4f}")
print(f"Recall (macro)   : {rec_rbf:.4f}")
print(f"F1-score (macro) : {f1_rbf:.4f}")
```

---

## CELDA 15 — Matrices de confusión (Linear vs RBF)

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

cm_linear = confusion_matrix(y_test, y_pred_linear, labels=orden_clases)
disp_linear = ConfusionMatrixDisplay(confusion_matrix=cm_linear, display_labels=orden_clases)
disp_linear.plot(ax=axes[0], cmap="Blues", colorbar=False)
axes[0].set_title("Matriz de Confusión — SVM Linear")

cm_rbf = confusion_matrix(y_test, y_pred_rbf, labels=orden_clases)
disp_rbf = ConfusionMatrixDisplay(confusion_matrix=cm_rbf, display_labels=orden_clases)
disp_rbf.plot(ax=axes[1], cmap="Greens", colorbar=False)
axes[1].set_title("Matriz de Confusión — SVM RBF")

plt.tight_layout()
plt.show()
```

---

## CELDA 16 — Validación cruzada estratificada (robustez adicional)

```python
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_scores_linear = cross_val_score(svm_linear, X_train_scaled, y_train, cv=cv, scoring="f1_macro")
cv_scores_rbf = cross_val_score(svm_rbf, X_train_scaled, y_train, cv=cv, scoring="f1_macro")

print("SVM Linear — F1-macro por fold:", cv_scores_linear.round(4))
print("SVM Linear — F1-macro promedio:", cv_scores_linear.mean().round(4), "±", cv_scores_linear.std().round(4))
print()
print("SVM RBF — F1-macro por fold:", cv_scores_rbf.round(4))
print("SVM RBF — F1-macro promedio:", cv_scores_rbf.mean().round(4), "±", cv_scores_rbf.std().round(4))
```

---

## CELDA 17 — Tabla comparativa final de modelos

```python
comparacion = pd.DataFrame({
    "Modelo": ["SVM Linear", "SVM RBF"],
    "Accuracy": [acc_linear, acc_rbf],
    "Precision (macro)": [prec_linear, prec_rbf],
    "Recall (macro)": [rec_linear, rec_rbf],
    "F1-score (macro)": [f1_linear, f1_rbf],
    "F1-macro CV (5-fold)": [cv_scores_linear.mean(), cv_scores_rbf.mean()],
})
comparacion = comparacion.round(4)
print(comparacion.to_string(index=False))

mejor_modelo_nombre = comparacion.loc[comparacion["F1-score (macro)"].idxmax(), "Modelo"]
print(f"\nMejor modelo según F1-macro en test: {mejor_modelo_nombre}")

plt.figure(figsize=(8, 5))
comparacion.set_index("Modelo")[["Accuracy", "Precision (macro)", "Recall (macro)", "F1-score (macro)"]].plot(
    kind="bar", ax=plt.gca()
)
plt.title("Comparación SVM Linear vs SVM RBF")
plt.ylabel("Score")
plt.ylim(0, 1)
plt.legend(loc="lower right")
plt.tight_layout()
plt.show()
```

---

## CELDA 18 — Exportación de modelos (.pkl) directo a Google Drive

```python
import os

mejor_modelo = svm_linear if mejor_modelo_nombre == "SVM Linear" else svm_rbf

# Misma carpeta de Drive donde está el dataset (DATASET_PATH, Celda 2).
# Si la sesión de Colab se cierra o se desconecta, los .pkl ya quedaron
# guardados en tu Drive, no se pierden.
OUTPUT_DIR = os.path.dirname(DATASET_PATH)

ruta_svm = os.path.join(OUTPUT_DIR, "financial_health_svm.pkl")
ruta_scaler = os.path.join(OUTPUT_DIR, "financial_health_scaler.pkl")

joblib.dump(mejor_modelo, ruta_svm)
joblib.dump(scaler, ruta_scaler)

print(f"Modelo exportado en Drive: {ruta_svm} (kernel={mejor_modelo.kernel}, modelo: {mejor_modelo_nombre})")
print(f"Scaler exportado en Drive: {ruta_scaler}")
print("\nFeatures esperadas por el modelo, en este orden exacto:")
print(FEATURES)
```

---

## CELDA 19 — (Opcional) Descarga local de los .pkl además de Drive

```python
from google.colab import files
files.download(ruta_svm)
files.download(ruta_scaler)
```

---

### Notas metodológicas

- **Variables usadas:** únicamente las 6 generadas en `financial_health_dataset.csv` a partir de fórmulas reales del sistema (`liquidez_corriente`, `endeudamiento`, `solvencia`, `endeudamiento_patrimonial`, `crecimiento_patrimonial`, `crecimiento_activos`). No se agregó ninguna variable externa.
- **`score_financiero` excluido de las features** por ser la base determinística de la etiqueta (`clasificacion_financiera` es un umbral fijo sobre `score_financiero`); incluirlo causaría fuga de información (target leakage) y el resultado dejaría de medir capacidad de generalización real.
- **`class_weight="balanced"`** en ambos SVM por el desbalance observado en la auditoría del dataset (Riesgo ≈ 4.5% de los registros).
- **StandardScaler ajustado solo con train**, aplicado a test sin volver a ajustar, para evitar fuga de información del set de prueba.
- **Validación cruzada (5-fold estratificada)** añadida como verificación adicional de estabilidad, más allá del único split train/test.
