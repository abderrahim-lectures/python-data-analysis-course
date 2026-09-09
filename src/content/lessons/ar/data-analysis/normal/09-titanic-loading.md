---

title: "تحميل واستكشاف بيانات تيتانيك"
description: "حمّل مجموعة بيانات تيتانيك وافحص بنيتها وافهم كل عمود واستعد للتحليل."
module: "titanic-eda"
order: 9
difficulty: "intermediate"
estimatedMinutes: 30
learningObjectives:
  - "تحميل مجموعة بيانات تيتانيك وفحص بنيتها"
  - "فحص بنية مجموعة البيانات باستخدام head() و info() و describe() و value_counts()"
  - "تحديد مشاكل جودة البيانات: القيم المفقودة والأنواع الخاطئة والتناقضات"
  - "توثيق الملاحظات الأولية قبل التنظيف"
prerequisites: ["groupby-aggregation"]
tags: ["pandas", "eda", "titanic", "exploration"]
hasPlayground: true
hasChallenge: true
hasQuiz: true
xpReward: 100
section: "data-analysis"
track: "normal"
quiz:
  - question: "كيف تحمّل ملف CSV باستخدام pandas؟"
    options:
      - text: "pd.read_csv('file.csv')"
        correct: true
      - text: "pd.load('file.csv')"
      - text: "pd.open('file.csv')"
      - text: "pd.import_csv('file.csv')"
  - question: "ماذا تُظهر df.head()؟"
    options:
      - text: "آخر 5 صفوف"
      - text: "أول 5 صفوف"
        correct: true
      - text: "جميع الصفوف"
      - text: "أسماء الأعمدة فقط"
  - question: "كيف تتحقق من أنواع بيانات جميع الأعمدة؟"
    options:
      - text: "df.types"
      - text: "df.dtypes"
        correct: true
      - text: "df.info.types"
      - text: "df.schema()"
---

## مجموعة بيانات تيتانيك

غرقت سفينة RMS Titanic في 15 أبريل 1912 بعد اصطدامها بجبل جليدي. تحتوي هذه المجموعة على معلومات عن 891 راكبًا، بما في ذلك ما إذا كانوا قد نجوا. وهي أكثر مجموعة بيانات استخدامًا لتعلم تحليل البيانات لأنها تمزج البيانات الرقمية والفئوية والمفقودة بطرق واقعية.

## تحميل البيانات

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")
```

## أول نظرة على البيانات

ابدأ دائمًا بـ `head()` لترى ما تتعامل معه:

```python
print(df.head(10))
```

المخرجات:

```
   PassengerId  Survived  Pclass  \
0            1         0       3   
1            2         1       1   
2            3         1       3   
3            4         1       1   
4            5         0       3   
...

                                                Name     Sex   Age  SibSp  \
0                            Braund, Mr. Owen Harris    male  22.0      1   
1  Cumings, Mrs. John Bradley (Florence Briggs Th...  female  38.0      1   
2                             Heikkinen, Miss. Laina  female  26.0      0   
3       Futrelle, Mrs. Jacques Heath (Lily May Peel)  female  35.0      1   
4                           Allen, Mr. William Henry    male  35.0      0   

   Parch            Ticket     Fare Cabin Embarked  
0      0         A/5 21171   7.2500   NaN        S  
1      0          PC 17599  71.2833   C85        C  
2      0  STON/O2. 3101282   7.9250   NaN        S  
3      0            113803  53.1000  C123        S  
4      0            373450   8.0500   NaN        S  
```

## فهم كل عمود

| العمود | الوصف | النوع |
|---|---|---|
| PassengerId | المعرف الفريد لكل راكب | int |
| Survived | النجاة (0 = لا، 1 = نعم) | int (ثنائي) |
| Pclass | درجة التذكرة (1 = أولى، 2 = ثانية، 3 = ثالثة) | int (ترتيبي) |
| Name | اسم الراكب | string |
| Sex | الجنس | string (ثنائي) |
| Age | العمر بالسنوات | float (به قيم مفقودة) |
| SibSp | عدد الإخوة/الأزواج على متن الطائرة | int |
| Parch | عدد الآباء/الأطفال على متن الطائرة | int |
| Ticket | رقم التذكرة | string |
| Fare | أجرة الراكب | float |
| Cabin | رقم المقصورة | string (مفقود في الغالب) |
| Embarked | ميناء الإقلاع (C, Q, S) | string (فئوي) |

## فحص عميق باستخدام info()

```python
print(df.info())
```

المخرجات:

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 12 columns):
 #   Column       Non-Null Count  Dtype  
---  ------       --------------  -----  
 0   PassengerId  891 non-null    int64  
 1   Survived     891 non-null    int64  
 2   Pclass       891 non-null    int64  
 3   Name         891 non-null    object 
 4   Sex          891 non-null    object 
 5   Age          714 non-null    float64
 6   SibSp        891 non-null    int64  
 7   Parch        891 non-null    int64  
 8   Ticket       891 non-null    object 
 9   Fare         891 non-null    float64
 10  Cabin        204 non-null    object 
 11  Embarked     889 non-null    object 
dtypes: float64(2), int64(5), object(5)
```

الملاحظات الرئيسية:
- **Age**: 177 قيمة مفقودة (20%)
- **Cabin**: 687 قيمة مفقودة (77%) — أكثر من اللازم للملء
- **Embarked**: قيمتان مفقودتان فقط — سهل الإصلاح

## الملخص الإحصائي

```python
print(df.describe())
```

يُظهر هذا العدد والمتوسط والانحراف المعياري والأدنى والربيعيات والأقصى لجميع الأعمدة الرقمية. لاحظ:
- `Fare` له نطاق واسع (من 0 إلى 512) بأقصى مرتفع — على الأرجح قيم شاذة
- `Age` يتراوح من 0.42 (رضيع) إلى 80 عامًا
- `Survived` ثنائي — متوسطه 0.38 يعني أن 38% نجوا

## التوزيعات الفئوية

```python
print(df["Sex"].value_counts())
# male      577
# female    314

print(df["Pclass"].value_counts().sort_index())
# 1    216
# 2    184
# 3    491

print(df["Embarked"].value_counts())
# S    644
# C    168
# Q     77
```

## ملخص القيم المفقودة

```python
missing = df.isna().sum()
missing_pct = (missing / len(df) * 100).round(1)
print(pd.DataFrame({"count": missing, "percent": missing_pct}).query("count > 0"))
```

المخرجات:

```
        count  percent
Age       177     19.9
Cabin     687     77.1
Embarked    2      0.2
```

## الملاحظات الأولية

قبل أي تحليل، لاحظ هذه الأنماط:
1. **فجوة النجاة الطبقية** — حظيت الدرجة الأولى على الأرجح بمعدلات نجاة أعلى
2. **الانحياز الجنسي** — قد تظهر سياسة "النساء والأطفال أولًا" في البيانات
3. **العمر المفقود** — مفقود بنسبة 20%، يحتاج إلى استراتيجية ملء
4. **Cabin عديم الفائدة** — مفقود بنسبة 77%، يُرجح حذفه
5. **قيم Fare الشاذة** — دفع بعض الركاب أكثر بكثير من غيرهم

## جرّب بنفسك

حمّل مجموعة بيانات تيتانيك وأجب عن هذه الأسئلة:
1. كم عدد الركاب المسافرين بمفردهم (SibSp == 0 و Parch == 0)؟
2. ما متوسط عمر الركاب الذكور مقابل الإناث؟
3. أي ميناء إقلاع حقق أعلى معدل نجاة؟

```python
import pandas as pd

# titanic.csv ships with the course — load it from the browser file system.
df = pd.read_csv("titanic.csv")

alone = ((df["SibSp"] == 0) & (df["Parch"] == 0)).sum()
print(f"Traveling alone: {alone}")

print(df.groupby("Sex")["Age"].mean())

print(df.groupby("Embarked")["Survived"].mean())
```

## خلاصات رئيسية

- ابدأ دائمًا التحليل الاستكشافي بـ `head()` و `info()` و `describe()` لفهم البنية
- يكشف `value_counts()` توزيع الأعمدة الفئوية
- يجب أن يسبق تحليل القيم المفقودة أي قرار تنظيف
- وثّق ملاحظاتك — فهي ترشد خطة التحليل بأكملها

## تحدي التطبيق

أنشئ "تقرير جودة البيانات" لمجموعة بيانات تيتانيك: لكل عمود، سجّل نوع البيانات وعدد القيم المفقودة وحقيقة واحدة مثيرة للاهتمام (مثل: "تتراوح Fare من 0 إلى 512"). سيرشدك هذا التقرير في خطوات التنظيف في الدرس التالي.
